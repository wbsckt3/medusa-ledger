/**
 * In-memory LedgerStore for OSS demos (single ledger per process).
 * Cloud/P2L implements the same shape with Mongo + tenantId.
 */
class MemoryStore {
  constructor() {
    this.blocks = [];
    this.transactions = [];
    this._txSeq = 0;
  }

  async findBlockByIndex(index) {
    return this.blocks.find((b) => b.index === index) || null;
  }

  async findLastBlock() {
    if (!this.blocks.length) return null;
    return this.blocks.reduce((a, b) => (a.index > b.index ? a : b));
  }

  async listBlocks({ limit = 50 } = {}) {
    return [...this.blocks]
      .sort((a, b) => b.index - a.index)
      .slice(0, Math.min(200, Math.max(1, Number(limit) || 50)));
  }

  async listBlocksAsc() {
    return [...this.blocks].sort((a, b) => a.index - b.index);
  }

  async createBlock(block) {
    const row = { ...block, id: `blk-${block.index}`, createdAt: new Date() };
    this.blocks.push(row);
    return row;
  }

  async findTransactionByEventId(eventId) {
    return this.transactions.find((t) => t.eventId === eventId) || null;
  }

  async createTransaction(tx) {
    this._txSeq += 1;
    const row = {
      ...tx,
      id: `tx-${this._txSeq}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.transactions.push(row);
    return row;
  }

  async listTransactions({ status, blockIndex, limit = 100 } = {}) {
    let rows = [...this.transactions];
    if (status) rows = rows.filter((t) => t.status === status);
    if (blockIndex != null && blockIndex !== '') {
      rows = rows.filter((t) => t.blockIndex === Number(blockIndex));
    }
    return rows
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Math.min(500, Math.max(1, Number(limit) || 100)));
  }

  async listPendingAsc({ maxTx = 50 } = {}) {
    return this.transactions
      .filter((t) => t.status === 'pending')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, Math.max(1, Number(maxTx) || 50));
  }

  async sealTransactions(ids, blockIndex) {
    const set = new Set(ids);
    for (const t of this.transactions) {
      if (set.has(t.id)) {
        t.status = 'sealed';
        t.blockIndex = blockIndex;
        t.updatedAt = new Date();
      }
    }
  }

  async countBlocks() {
    return this.blocks.length;
  }

  async countTransactions(status) {
    if (!status) return this.transactions.length;
    return this.transactions.filter((t) => t.status === status).length;
  }

  async sumAmountSince(start) {
    return this.transactions
      .filter((t) => t.createdAt >= start && t.amount != null)
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }

  async findLastTransaction() {
    if (!this.transactions.length) return null;
    return [...this.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  async listSealedForBlock(blockIndex) {
    return this.transactions
      .filter((t) => t.blockIndex === blockIndex && t.status === 'sealed')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
}

module.exports = { MemoryStore };
