const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const pickDefined = require('../utils/pickDefined');
const { memberFilter, findProjectForUser, isProjectParticipant } = require('../utils/projectAccess');
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
  body('assignee').optional({ values: 'null' }).isMongoId().withMessage('Invalid assignee'),
  ...(createMode ? [body('project').notEmpty().withMessage('Project required').isMongoId()] : []),
];

// GET /api/tasks?project=<id> — tasks in projects I own or belong to
router.get('/', auth, async (req, res) => {
  try {
    let filter;
    if (req.query.project) {
      const project = await findProjectForUser(String(req.query.project), req.user.id);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      filter = { project: project._id };
    } else {
      const projectIds = await Project.find(memberFilter(req.user.id)).distinct('_id');
      filter = { project: { $in: projectIds } };
    }
    const tasks = await Task.find(filter).sort({ createdAt: -1 }).populate('assignee', 'name');
    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', auth, taskRules(true), validate, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project, assignee } = req.body;

    const proj = await findProjectForUser(project, req.user.id);
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    if (assignee && !isProjectParticipant(proj, assignee))
      return res.status(400).json({ message: 'Assignee must be a project member' });

    const task = await Task.create({
      title, description, status, priority, dueDate, project,
      assignee: assignee || null,
      owner: req.user.id,
    });
    await task.populate('assignee', 'name');
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id — any project participant
router.put('/:id', auth, taskRules(false), validate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const proj = await findProjectForUser(task.project, req.user.id);
    if (!proj) return res.status(404).json({ message: 'Task not found' });

    const { title, description, status, priority, dueDate, assignee } = req.body;
    if (assignee && !isProjectParticipant(proj, assignee))
      return res.status(400).json({ message: 'Assignee must be a project member' });

    const updates = pickDefined({ title, description, status, priority, dueDate, assignee });
    const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('assignee', 'name');
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id — any project participant
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const proj = await findProjectForUser(task.project, req.user.id);
    if (!proj) return res.status(404).json({ message: 'Task not found' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
