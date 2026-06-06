module.exports = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
