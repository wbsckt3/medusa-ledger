const { hashPayload, computeBlockHash } = require('./hash');

function sanitizeTx(doc) {
  if (!doc) return null;
  return {
    id: String(doc.id),
    eventId: doc.eventId,
    eventType: doc.eventType,
    amount: doc.amount != null ? doc.amount : doc.amountCop,
    amountCop: doc.amountCop != null ? doc.amountCop : doc.amount,
    currency: doc.currency || 'COP',
    actors: doc.actors || [],
    payloadHash: doc.payloadHash || '',
    payloadRef: doc.payloadRef,
    source: doc.source || '',
    status: doc.status,
    blockIndex: doc.blockIndex,
    whiteLabel: doc.whiteLabel || '',
    companyId: doc.companyId || '',
    refPayco: doc.refPayco || '',
    tenantId: doc.tenantId || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function sanitizeBlock(doc) {
  if (!doc) return null;
  return {
    id: String(doc.id),
    index: doc.index,
    timestamp: doc.timestamp,
    previousHash: doc.previousHash,
    hash: doc.hash,
    txCount: doc.txCount || 0,
    sealedAt: doc.sealedAt,
    createdAt: doc.createdAt
  };
}

/**
 * Ledger engine over a LedgerStore (MemoryStore OSS, Mongo adapter Cloud/P2L).
 */
class MedusaChain {
  constructor(store, { autoSeal = true, ledgerId = 'default' } = {}) {
    if (!store) throw new Error('store required');
    this.store = store;
    this.autoSeal = autoSeal;
    this.ledgerId = ledgerId;
  }

  async ensureGenesis() {
    const existing = await this.store.findBlockByIndex(0);
    if (existing) return existing;
    const timestamp = new Date();
    const previousHash = '0';
    const hash = computeBlockHash({ index: 0, timestamp, previousHash, txHashes: ['GENESIS'] });
    return this.store.createBlock({
      index: 0,
      timestamp,
      previousHash,
      hash,
      txCount: 0,
      transactionIds: [],
      sealedAt: timestamp
    });
  }

  async appendEvent(event) {
    await this.ensureGenesis();
    const eventId = String((event && (event.eventId || event.refPayco)) || '').trim();
    if (!eventId) {
      const err = new Error('eventId required');
      err.code = 'EVENT_ID_REQUIRED';
      throw err;
    }

    const existing = await this.store.findTransactionByEventId(eventId);
    if (existing) {
      return { duplicate: true, transaction: sanitizeTx(existing) };
    }

    const payloadRef =
      (event && event.payloadRef) ||
      (event && event.payload) || {
        amount: event && (event.amount != null ? event.amount : event.amountCop),
        source: (event && event.source) || ''
      };
    const payloadHash = (event && event.payloadHash) || hashPayload(payloadRef);

    const doc = await this.store.createTransaction({
      eventId,
      eventType: String((event && event.eventType) || 'unknown'),
      amount: event && (event.amount != null ? Number(event.amount) : event.amountCop != null ? Number(event.amountCop) : null),
      currency: (event && event.currency) || 'COP',
      actors: Array.isArray(event && event.actors) ? event.actors : [],
      payloadHash,
      payloadRef,
      source: String((event && event.source) || ''),
      status: 'pending',
      blockIndex: null,
      // Optional Cloud / multi-tenant fields (ignored by MemoryStore)
      whiteLabel: event && event.whiteLabel,
      companyId: event && event.companyId,
      refPayco: event && event.refPayco
    });

    let block = null;
    if (this.autoSeal) {
      const sealed = await this.sealPending({ maxTx: 50 });
      block = sealed && sealed.block ? sealed.block : null;
    }

    return { duplicate: false, transaction: sanitizeTx(doc), block };
  }

  async sealPending({ maxTx = 50 } = {}) {
    await this.ensureGenesis();
    const pending = await this.store.listPendingAsc({ maxTx });
    if (!pending.length) {
      return { sealed: false, reason: 'NO_PENDING', block: null };
    }

    const last = await this.store.findLastBlock();
    const nextIndex = last ? Number(last.index) + 1 : 1;
    const previousHash = last ? last.hash : '0';
    const timestamp = new Date();
    const txHashes = pending.map((t) => t.payloadHash || String(t.id));
    const hash = computeBlockHash({ index: nextIndex, timestamp, previousHash, txHashes });

    const block = await this.store.createBlock({
      index: nextIndex,
      timestamp,
      previousHash,
      hash,
      txCount: pending.length,
      transactionIds: pending.map((t) => t.id),
      sealedAt: timestamp
    });

    await this.store.sealTransactions(
      pending.map((t) => t.id),
      nextIndex
    );

    return { sealed: true, block: sanitizeBlock(block), txCount: pending.length };
  }

  async listBlocks(opts) {
    await this.ensureGenesis();
    const rows = await this.store.listBlocks(opts);
    return rows.map(sanitizeBlock);
  }

  async listTransactions(opts) {
    const rows = await this.store.listTransactions(opts);
    return rows.map(sanitizeTx);
  }

  async getSummary() {
    await this.ensureGenesis();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [blocks, pending, sealed, amountToday, lastTx] = await Promise.all([
      this.store.countBlocks(),
      this.store.countTransactions('pending'),
      this.store.countTransactions('sealed'),
      this.store.sumAmountSince(start),
      this.store.findLastTransaction()
    ]);
    return {
      ledgerId: this.ledgerId,
      enabled: true,
      blocks,
      pending,
      sealed,
      amountToday,
      lastTx: sanitizeTx(lastTx)
    };
  }

  async verifyChain() {
    const blocks = await this.store.listBlocksAsc();
    if (!blocks.length) return { valid: false, error: 'NO_BLOCKS' };

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.index !== i) return { valid: false, error: 'INDEX_GAP', at: b.index };
      if (i === 0) {
        if (b.previousHash !== '0') return { valid: false, error: 'GENESIS_PREV', at: 0 };
      } else if (b.previousHash !== blocks[i - 1].hash) {
        return { valid: false, error: 'PREV_HASH_MISMATCH', at: b.index };
      }

      const txs = await this.store.listSealedForBlock(b.index);
      const txHashes =
        b.index === 0 && !txs.length ? ['GENESIS'] : txs.map((t) => t.payloadHash || String(t.id));
      const expected = computeBlockHash({
        index: b.index,
        timestamp: b.timestamp,
        previousHash: b.previousHash,
        txHashes
      });
      if (expected !== b.hash) return { valid: false, error: 'HASH_MISMATCH', at: b.index };
    }

    return { valid: true, blocks: blocks.length };
  }
}

module.exports = { MedusaChain, sanitizeTx, sanitizeBlock };
