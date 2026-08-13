const crypto = require('crypto');

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function hashPayload(obj) {
  return sha256(JSON.stringify(obj == null ? {} : obj));
}

function computeBlockHash({ index, timestamp, previousHash, txHashes }) {
  const body = `${index}|${new Date(timestamp).toISOString()}|${previousHash}|${(txHashes || []).join(',')}`;
  return sha256(body);
}

module.exports = { sha256, hashPayload, computeBlockHash };
