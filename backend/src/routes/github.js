const router = require('express').Router();
const { Octokit } = require('@octokit/rest');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const { encrypt } = require('../utils/crypto');
const { getOctokit, fetchBranches, fetchLoc } = require('../utils/github');

async function syncProject(project, octokit) {
  const [owner, repo] = project.github.fullName.split('/');
  const { data } = await octokit.rest.repos.get({ owner, repo });

  project.github.stars = data.stargazers_count;
  project.github.openIssues = data.open_issues_count;
  project.github.language = data.language;
  project.github.lastPush = data.pushed_at;
  project.github.defaultBranch = data.default_branch;
  project.description = data.description || project.description;
  project.github.branches = await fetchBranches(octokit, owner, repo);

  const loc = await fetchLoc(project.github.fullName);
  if (loc) project.github.loc = loc;

  project.github.syncedAt = new Date();
  await project.save();
  return project;
}

// GET /api/github/status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ connected: !!user.githubUsername, username: user.githubUsername || null });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/github/token
router.post('/token', auth, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token required' });
  try {
    const { data } = await new Octokit({ auth: token }).rest.users.getAuthenticated();
    await User.findByIdAndUpdate(req.user.id, {
      githubUsername: data.login,
      githubToken: encrypt(token),
    });
    res.json({ connected: true, username: data.login });
  } catch (err) {
    if (err.status === 401) return res.status(400).json({ message: 'Invalid GitHub token' });
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/github/token
router.delete('/token', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { githubUsername: null, githubToken: null });
    res.json({ connected: false });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/github/repos
router.get('/repos', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+githubToken');
    const octokit = getOctokit(user);
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({ sort: 'pushed', per_page: 100 });
    const tracked = await Project.find({ owner: req.user.id, source: 'github' }).select('github.repoId');
    const trackedIds = new Set(tracked.map((p) => p.github.repoId));
    const repos = data.map((r) => ({
      repoId: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      htmlUrl: r.html_url,
      stars: r.stargazers_count,
      openIssues: r.open_issues_count,
      language: r.language,
      lastPush: r.pushed_at,
      tracked: trackedIds.has(r.id),
    }));
    res.json(repos);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Failed to load repos' });
  }
});

// POST /api/github/track
router.post('/track', auth, async (req, res) => {
  const { repoId, name, fullName, description, htmlUrl, stars, openIssues, language, lastPush } = req.body;
  if (!repoId || !fullName) return res.status(400).json({ message: 'Repo data required' });
  try {
    const existing = await Project.findOne({ owner: req.user.id, source: 'github', 'github.repoId': repoId });
    if (existing) return res.json(existing);
    const project = await Project.create({
      name: name || fullName,
      description: description || '',
      owner: req.user.id,
      source: 'github',
      github: { repoId, fullName, htmlUrl, stars, openIssues, language, lastPush },
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/github/sync/:id
router.post('/sync/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id, source: 'github' });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(req.user.id).select('+githubToken');
    const octokit = getOctokit(user);
    await syncProject(project, octokit);
    res.json(project);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Sync failed' });
  }
});

// POST /api/github/sync-all
router.post('/sync-all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+githubToken');
    const octokit = getOctokit(user);
    const projects = await Project.find({ owner: req.user.id, source: 'github' });

    let synced = 0;
    let failed = 0;
    for (const project of projects) {
      try {
        await syncProject(project, octokit);
        synced += 1;
      } catch {
        failed += 1;
      }
    }
    res.json({ synced, failed });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Sync failed' });
  }
});

module.exports = router;
