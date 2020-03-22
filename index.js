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

function getCards() {
  return performRequest({
    token,
    path: "GET /projects/columns/{column_id}/cards",
    inputs: _.omit(inputs, ["token"]),
  });
}

function getIssueForCard(card) {
  return performRequest({
    token,
    path: `GET ${card['content_url'].replace('https://api.github.com', '')}`,
    inputs: _.omit(inputs, ["token"])
  })
}

function moveCard(cards, index) {
  const card = cards[index];

  performRequest({
    token,
    path: `POST /projects/columns/cards/{card_id}/moves`,
    inputs: {
      card_id: card.id,
      position: 'bottom',
      column_id: 8413302,
    }
  }).then(_ => {
    if (index + 1 < cards.length) {
      moveCard(cards, index + 1);
    } else {
      console.log("done!");
    }
  }).catch(error => {
    core.setFailed(error.message);
  });
}

function rearrangeCards() {
  getCards().then(result => {
    if (result && result['data']) {
      const promises = result['data'].filter(card => {
        return card['content_url'] != null;
      }).map(card => {
        return getIssueForCard(card).then(issue => {
          card.labels = issue['data']['labels'].map(label => label.name);
          return card;
        });
      });

      Promise.all(promises).then(cards => {
        moveCard(_.sortBy(cards, card => {
          if (card.labels.length > 0) {
            return order.indexOf(card.labels[0])
          } else {
            return order.length;
          }
        }), 0);
      }).catch(error => {
        core.setFailed(error.message);
      });
    }
  }).catch(error => {
    core.setFailed(error.message);
  });
}

rearrangeCards();
