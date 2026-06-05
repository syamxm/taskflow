const { Octokit } = require('@octokit/rest');
const { decrypt } = require('./crypto');

function getOctokit(user) {
  if (!user?.githubToken?.data) {
    const err = new Error('GitHub not connected');
    err.status = 400;
    throw err;
  }
  return new Octokit({ auth: decrypt(user.githubToken) });
}

module.exports = { getOctokit };
