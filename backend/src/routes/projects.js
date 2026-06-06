const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const pickDefined = require('../utils/pickDefined');
const Project = require('../models/Project');
const Task = require('../models/Task');

const projectRules = (nameRequired) => [
  nameRequired
    ? body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 })
    : body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('color').optional({ values: 'falsy' }).trim().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid color'),
];

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user.id }).sort({ createdAt: -1 });
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

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, projectRules(false), validate, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const updates = pickDefined({ name, description, color });
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id
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

module.exports = router;
