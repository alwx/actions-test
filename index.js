const _ = require('lodash');
const core = require('@actions/core');
const {request} = require("@octokit/request");

const token = core.getInput("token");
const column_id = parseInt(core.getInput("column_id"));
const order = core.getInput("order").split(',');

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
    inputs: {
      column_id,
      archived_state: 'all',
      per_page: 100,
      page: 1,
    }
  });
}

function moveCard(cards, index) {
  performRequest({
    token,
    path: `POST /projects/columns/cards/{card_id}/moves`,
    inputs: {
      card_id: cards[index].id,
      position: 'bottom',
      column_id,
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

function sortCardLabels(labels) {
  return _.sortBy(labels, label => {
    const index = order.indexOf(label);
    if (index >= 0) {
      return index;
    }
    return labels.length;
  });
}

function sortCards(cards) {
  return _.sortBy(cards, card => {
    if (card.labels.length > 0) {
      const sortedLabels = sortCardLabels(card.labels);
      const index = order.indexOf(sortedLabels[0]);
      if (index >= 0) {
        return index;
      }
      return order.length;
    } else {
      return order.length;
    }
  });
}

function rearrangeCards() {
  getCards().then(result => {
    if (result && result['data']) {
      const promises = result['data'].filter(card => {
        return card['content_url'] != null;
      }).map(card => {
        return performRequest({
          token,
          path: `GET ${card['content_url'].replace('https://api.github.com', '')}`,
        }).then(issue => {
          card.labels = issue['data']['labels'].map(label => label.name);
          return card;
        });
      });

      Promise.all(promises).then(cards => {
        moveCard(sortCards(cards), 0);
      }).catch(error => {
        core.setFailed(error.message);
      });
    }
  }).catch(error => {
    core.setFailed(error.message);
  });
}

rearrangeCards();
