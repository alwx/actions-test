const _ = require('lodash');
const core = require('@actions/core');
const {request} = require("@octokit/request");

const token = core.getInput("token");
const column_id = core.getInput("column_id");
const archived_state = core.getInput("archived_state");
const per_page = core.getInput("per_page");
const page = core.getInput("page");

const previews = [
  "inertia",
];

const inputs = {
  token,
  column_id,
  archived_state,
  per_page,
  page,
};

async function octionRequest(
  token,
  method,
  path,
  previews,
  inputs
) {
  const requestWithAuth = request.defaults({
    headers: {
      authorization: `Bearer ${token}`
    },
    mediaType: {
      previews
    }
  });
  return await requestWithAuth(`${method} ${path}`, inputs);
}

octionRequest(token,
  "get",
  "/projects/columns/{column_id}/cards",
  previews,
  _.omit(inputs, ["token", "file_output", "custom_outputs"])
).then(result => {
  console.log("ALWX RESULT", result);
})
  .catch(error => {
    console.log("error", error);
    core.setFailed(error.message);
  });