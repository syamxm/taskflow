const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

function key() {
  const k = process.env.ENCRYPTION_KEY;
  if (!k || k.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  return Buffer.from(k, 'hex');
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv, { authTagLength: AUTH_TAG_LENGTH });
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    data: data.toString('hex'),
  };
}

function decrypt(payload) {
  const decipher = crypto.createDecipheriv(ALGO, key(), Buffer.from(payload.iv, 'hex'), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(payload.data, 'hex')), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
