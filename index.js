const _ = require('lodash');
const core = require('@actions/core');
const {request} = require("@octokit/request");

const token = core.getInput("token");
const column_id = core.getInput("column_id");
const archived_state = core.getInput("archived_state");
const per_page = core.getInput("per_page");
const page = core.getInput("page");

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
  performRequest({
    token,
    path: "GET /projects/columns/{column_id}/cards",
    inputs: _.omit(inputs, ["token"]),
  }).then(result => {
    if (result && result['data']) {
      console.log(result['data']);
    }
  }).catch(error => {
    core.setFailed(error.message);
  });
}

getCards();
