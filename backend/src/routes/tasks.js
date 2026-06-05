const router = require('express').Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

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
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'Title and project required' });

    const proj = await Project.findOne({ _id: project, owner: req.user.id });
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({ title, description, status, priority, dueDate, project, owner: req.user.id });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const updates = { title, description, status, priority, dueDate };
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
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
