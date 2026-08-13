/**
 * Minimal fetch client for Medusa Ledger HTTP API.
 */
class MedusaLedgerClient {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = String(baseUrl || '').replace(/\/$/, '');
  }

  async _json(path, opts) {
    const res = await fetch(`${this.baseUrl}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data && data.message) || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  summary() {
    return this._json('/api/summary');
  }

  blocks(limit) {
    const q = limit ? `?limit=${encodeURIComponent(limit)}` : '';
    return this._json(`/api/blocks${q}`);
  }

  verify() {
    return this._json('/api/verify');
  }

  seal(body = {}) {
    return this._json('/api/seal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  appendEvent(event) {
    return this._json('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event || {})
    });
  }
}

module.exports = { MedusaLedgerClient };
