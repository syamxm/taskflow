const mongoose = require('mongoose');

const hitSchema = new mongoose.Schema({
  _id: String,
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, index: { expires: 0 } },
});

const RateLimitHit =
  mongoose.models.RateLimitHit || mongoose.model('RateLimitHit', hitSchema);

class MongoStore {
  constructor({ prefix = '' } = {}) {
    this.prefix = prefix;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  key(key) {
    return this.prefix + key;
  }

  async increment(key) {
    const id = this.key(key);
    const now = new Date();

    const current = await RateLimitHit.findOneAndUpdate(
      { _id: id, expiresAt: { $gt: now } },
      { $inc: { count: 1 } },
      { new: true }
    );
    if (current) return { totalHits: current.count, resetTime: current.expiresAt };

    const resetTime = new Date(now.getTime() + this.windowMs);
    const fresh = await RateLimitHit.findOneAndUpdate(
      { _id: id },
      { $set: { count: 1, expiresAt: resetTime } },
      { new: true, upsert: true }
    );
    return { totalHits: fresh.count, resetTime: fresh.expiresAt };
  }

  async decrement(key) {
    await RateLimitHit.updateOne(
      { _id: this.key(key), expiresAt: { $gt: new Date() } },
      { $inc: { count: -1 } }
    );
  }

  async resetKey(key) {
    await RateLimitHit.deleteOne({ _id: this.key(key) });
  }
}

module.exports = MongoStore;
