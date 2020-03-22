const _ = require('lodash');
const core = require('@actions/core');
const {request} = require("@octokit/request");

const token = core.getInput("token");
const column_id = core.getInput("column_id");
const archived_state = core.getInput("archived_state");
const per_page = core.getInput("per_page");
const page = core.getInput("page");
const order = core.getInput("order").split(',');

const inputs = {
  token,
  column_id,
  archived_state,
  per_page,
  page,
};

async function performRequest({token, path, inputs}) {
  const requestWithAuth = request.defaults({
    headers: {
      authorization: `Bearer ${token}`
    },
    mediaType: {
      previews: ["inertia"]
    }
  });
  return await requestWithAuth(path, inputs);
}

function getIssueForCard(card) {
  return performRequest({
    token,
    path: `GET ${card['content_url'].replace('https://api.github.com', '')}`,
    inputs: _.omit(inputs, ["token"])
  })
}

function moveCards(cards) {
  console.log(cards);
}

function getCards() {
  performRequest({
    token,
    path: "GET /projects/columns/{column_id}/cards",
    inputs: _.omit(inputs, ["token"]),
  }).then(result => {
    if (result && result['data']) {
      const promises = result['data'].filter(card => {
        return card['content_url'] != null;
      }).map(card => {
        return getIssueForCard(card).then(issue => {
          card.labels = issue['data']['labels'];
          return card;
        });
      });

      Promise.all(promises).then(cards => {
        moveCards(_.sortBy(cards, (v) => order.indexOf(v.labels[0])));
      }).catch(error => {
        core.setFailed(error.message);
      });
    }
  }).catch(error => {
    core.setFailed(error.message);
  });
}

getCards();
