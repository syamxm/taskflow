const mongoose = require('mongoose');

const githubTokenSchema = new mongoose.Schema(
  { iv: String, authTag: String, data: String },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    githubUsername: { type: String, default: null },
    githubToken: { type: githubTokenSchema, select: false, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
