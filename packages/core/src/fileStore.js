const fs = require('fs');
const path = require('path');

/**
 * File-based LedgerStore (embedded OSS mode).
 * Layout: {dir}/metadata.json + {dir}/blocks/000000.json ...
 */
class FileStore {
  constructor(dir) {
    this.dir = path.resolve(String(dir || './ledger'));
    this.blocksDir = path.join(this.dir, 'blocks');
    this.metaPath = path.join(this.dir, 'metadata.json');
    this.txPath = path.join(this.dir, 'transactions.json');
    fs.mkdirSync(this.blocksDir, { recursive: true });
    if (!fs.existsSync(this.metaPath)) {
      fs.writeFileSync(this.metaPath, JSON.stringify({ version: 1, txSeq: 0 }, null, 2));
    }
    if (!fs.existsSync(this.txPath)) {
      fs.writeFileSync(this.txPath, JSON.stringify([], null, 2));
    }
  }

  _readMeta() {
    return JSON.parse(fs.readFileSync(this.metaPath, 'utf8'));
  }

  _writeMeta(meta) {
    fs.writeFileSync(this.metaPath, JSON.stringify(meta, null, 2));
  }

  _readTxs() {
    return JSON.parse(fs.readFileSync(this.txPath, 'utf8'));
  }

  _writeTxs(rows) {
    fs.writeFileSync(this.txPath, JSON.stringify(rows, null, 2));
  }

  _blockPath(index) {
    return path.join(this.blocksDir, `${String(index).padStart(6, '0')}.json`);
  }

  _readBlock(index) {
    const p = this._blockPath(index);
    if (!fs.existsSync(p)) return null;
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return {
      ...raw,
      timestamp: new Date(raw.timestamp),
      createdAt: new Date(raw.createdAt),
      sealedAt: raw.sealedAt ? new Date(raw.sealedAt) : raw.sealedAt
    };
  }

  _writeBlock(block) {
    const row = {
      ...block,
      timestamp: new Date(block.timestamp).toISOString(),
      createdAt: new Date(block.createdAt || block.timestamp).toISOString(),
      sealedAt: block.sealedAt ? new Date(block.sealedAt).toISOString() : block.sealedAt
    };
    fs.writeFileSync(this._blockPath(block.index), JSON.stringify(row, null, 2));
    return this._readBlock(block.index);
  }

  async findBlockByIndex(index) {
    return this._readBlock(index);
  }

  async findLastBlock() {
    const files = fs.readdirSync(this.blocksDir).filter((f) => f.endsWith('.json'));
    if (!files.length) return null;
    const indices = files.map((f) => parseInt(f.replace('.json', ''), 10)).sort((a, b) => b - a);
    return this._readBlock(indices[0]);
  }

  async listBlocks({ limit = 50 } = {}) {
    const files = fs.readdirSync(this.blocksDir).filter((f) => f.endsWith('.json'));
    const indices = files.map((f) => parseInt(f.replace('.json', ''), 10)).sort((a, b) => b - a);
    return indices.slice(0, Math.min(200, Math.max(1, Number(limit) || 50))).map((i) => this._readBlock(i));
  }

  async listBlocksAsc() {
    const files = fs.readdirSync(this.blocksDir).filter((f) => f.endsWith('.json'));
    const indices = files.map((f) => parseInt(f.replace('.json', ''), 10)).sort((a, b) => a - b);
    return indices.map((i) => this._readBlock(i));
  }

  async createBlock(block) {
    const row = { ...block, id: `blk-${block.index}`, createdAt: new Date() };
    return this._writeBlock(row);
  }

  async findTransactionByEventId(eventId) {
    return this._readTxs().find((t) => t.eventId === eventId) || null;
  }

  async createTransaction(tx) {
    const meta = this._readMeta();
    meta.txSeq = (meta.txSeq || 0) + 1;
    this._writeMeta(meta);
    const rows = this._readTxs();
    const row = {
      ...tx,
      id: `tx-${meta.txSeq}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    rows.push(row);
    this._writeTxs(rows);
    return { ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) };
  }

  async listTransactions({ status, blockIndex, limit = 100 } = {}) {
    let rows = this._readTxs().map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt)
    }));
    if (status) rows = rows.filter((t) => t.status === status);
    if (blockIndex != null && blockIndex !== '') {
      rows = rows.filter((t) => t.blockIndex === Number(blockIndex));
    }
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.min(500, Math.max(1, Number(limit) || 100)));
  }

  async listPendingAsc({ maxTx = 50 } = {}) {
    return this._readTxs()
      .map((t) => ({ ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) }))
      .filter((t) => t.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, Math.max(1, Number(maxTx) || 50));
  }

  async sealTransactions(ids, blockIndex) {
    const set = new Set(ids);
    const rows = this._readTxs();
    for (const t of rows) {
      if (set.has(t.id)) {
        t.status = 'sealed';
        t.blockIndex = blockIndex;
        t.updatedAt = new Date().toISOString();
      }
    }
    this._writeTxs(rows);
  }

  async countBlocks() {
    return fs.readdirSync(this.blocksDir).filter((f) => f.endsWith('.json')).length;
  }

  async countTransactions(status) {
    const rows = this._readTxs();
    if (!status) return rows.length;
    return rows.filter((t) => t.status === status).length;
  }

  async sumAmountSince(start) {
    const s = new Date(start);
    return this._readTxs()
      .filter((t) => new Date(t.createdAt) >= s && t.amount != null)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  async findLastTransaction() {
    const rows = this._readTxs();
    if (!rows.length) return null;
    const sorted = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const t = sorted[0];
    return { ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) };
  }

  async listSealedForBlock(blockIndex) {
    return this._readTxs()
      .map((t) => ({ ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) }))
      .filter((t) => t.blockIndex === blockIndex && t.status === 'sealed')
      .sort((a, b) => a.createdAt - b.createdAt);
  }
}

module.exports = { FileStore };
