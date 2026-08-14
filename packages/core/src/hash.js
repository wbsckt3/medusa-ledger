const crypto = require('crypto');

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

/** Deterministic JSON for cross-stack hash compatibility (SPEC). */
function canonicalJson(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
}

function hashPayload(obj) {
  return sha256(canonicalJson(obj == null ? {} : obj));
}

function computeBlockHash({ index, timestamp, previousHash, txHashes }) {
  const body = `${index}|${new Date(timestamp).toISOString()}|${previousHash}|${(txHashes || []).join(',')}`;
  return sha256(body);
}

module.exports = { sha256, canonicalJson, hashPayload, computeBlockHash };
