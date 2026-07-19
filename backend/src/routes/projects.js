const router = require('express').Router();
const { body } = require('express-validator');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const pickDefined = require('../utils/pickDefined');
const { memberFilter } = require('../utils/projectAccess');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const projectRules = (nameRequired) => [
  nameRequired
    ? body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 })
    : body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('color').optional({ values: 'falsy' }).trim().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid color'),
];

// GET /api/projects — owned and shared-with-me
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find(memberFilter(req.user.id)).sort({ createdAt: -1 });
    const projectsWithCount = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        const doneCount = await Task.countDocuments({ project: p._id, status: 'done' });
        return { ...p.toObject(), taskCount, doneCount };
      })
    );
    res.json(projectsWithCount);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/invites — projects I'm invited to
router.get('/invites', auth, async (req, res) => {
  try {
    const invites = await Project.find({ pendingInvites: req.user.id })
      .select('name color owner')
      .populate('owner', 'name');
    res.json(invites);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects
router.post('/', auth, projectRules(true), validate, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const project = await Project.create({ name, description, color, owner: req.user.id });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id — owner or member; others get 404
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...memberFilter(req.user.id) })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate('pendingInvites', 'name');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id — owner only
router.put('/:id', auth, projectRules(false), validate, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const updates = pickDefined({ name, description, color });
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { returnDocument: 'after', runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id — owner only
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/invite — owner invites by name or email
router.post(
  '/:id/invite',
  auth,
  [body('query').trim().notEmpty().withMessage('Username or email required').isLength({ max: 200 })],
  validate,
  async (req, res) => {
    try {
      const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const { query } = req.body;
      const target = await User.findOne({
        $or: [{ email: query.toLowerCase() }, { name: query }],
      }).select('_id');
      if (!target) return res.status(404).json({ message: 'User not found' });

      const targetId = String(target._id);
      if (targetId === String(project.owner))
        return res.status(400).json({ message: 'User already has access' });
      if (project.members.some((m) => String(m) === targetId))
        return res.status(400).json({ message: 'User already has access' });
      if (project.pendingInvites.some((p) => String(p) === targetId))
        return res.status(400).json({ message: 'Invite already pending' });

      project.pendingInvites.push(target._id);
      await project.save();
      res.json({ message: 'Invite sent' });
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/projects/:id/invites/accept — invited user joins
router.post('/:id/invites/accept', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, pendingInvites: req.user.id },
      { $pull: { pendingInvites: req.user.id }, $addToSet: { members: req.user.id } }
    );
    if (!project) return res.status(404).json({ message: 'Invite not found' });
    res.json({ message: 'Invite accepted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/invites/decline
router.post('/:id/invites/decline', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, pendingInvites: req.user.id },
      { $pull: { pendingInvites: req.user.id } }
    );
    if (!project) return res.status(404).json({ message: 'Invite not found' });
    res.json({ message: 'Invite declined' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId — owner removes member; their tasks stay, unassigned
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId))
      return res.status(400).json({ message: 'Invalid user id' });

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id, members: req.params.userId },
      { $pull: { members: req.params.userId } }
    );
    if (!project) return res.status(404).json({ message: 'Member not found' });

    await Task.updateMany(
      { project: req.params.id, assignee: req.params.userId },
      { assignee: null }
    );
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
