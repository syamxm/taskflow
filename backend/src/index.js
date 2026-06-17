require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const githubRoutes = require('./routes/github');
const { apiLimiter } = require('./middleware/rateLimiters');

const app = express();
const PORT = process.env.PORT || 5000;

// Behind nginx reverse proxy
app.set('trust proxy', 1);

app.use(helmet());
// Same-origin via nginx; allow cross-origin only if explicitly configured
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/github', githubRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on :${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
