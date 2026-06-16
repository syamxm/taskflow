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

async function fetchBranches(octokit, owner, repo) {
  const { data } = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 });
  return data.map((b) => ({ name: b.name, protected: b.protected, sha: b.commit.sha }));
}

async function fetchLoc(fullName) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(
      `https://api.codetabs.com/v1/loc?github=${encodeURIComponent(fullName)}`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    const total = rows.find((r) => r.language === 'Total');
    const byLanguage = rows
      .filter((r) => r.language !== 'Total')
      .map((r) => ({ language: r.language, lines: r.linesOfCode, files: r.files }));
    return { total: total?.linesOfCode ?? 0, byLanguage };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { getOctokit, fetchBranches, fetchLoc };
