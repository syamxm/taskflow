const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const pickDefined = require('../utils/pickDefined');
const Task = require('../models/Task');
const Project = require('../models/Project');

const STATUS = ['todo', 'in-progress', 'done'];
const PRIORITY = ['low', 'medium', 'high'];

const taskRules = (createMode) => [
  createMode
    ? body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 })
    : body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional({ values: 'falsy' }).isIn(STATUS).withMessage('Invalid status'),
  body('priority').optional({ values: 'falsy' }).isIn(PRIORITY).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date').toDate(),
  ...(createMode ? [body('project').notEmpty().withMessage('Project required').isMongoId()] : []),
];

// GET /api/tasks?project=<id>
router.get('/', auth, async (req, res) => {
  try {
    const filter = { owner: req.user.id };
    if (req.query.project) filter.project = String(req.query.project);
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', auth, taskRules(true), validate, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project } = req.body;

    const proj = await Project.findOne({ _id: project, owner: req.user.id });
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({ title, description, status, priority, dueDate, project, owner: req.user.id });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, taskRules(false), validate, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const updates = pickDefined({ title, description, status, priority, dueDate });
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
