const Project = require('../models/Project');

const memberFilter = (userId) => ({ $or: [{ owner: userId }, { members: userId }] });

const findProjectForUser = (projectId, userId) =>
  Project.findOne({ _id: projectId, ...memberFilter(userId) });

const isProjectParticipant = (project, userId) => {
  const id = String(userId);
  return (
    String(project.owner._id || project.owner) === id ||
    project.members.some((m) => String(m._id || m) === id)
  );
};

module.exports = { memberFilter, findProjectForUser, isProjectParticipant };
