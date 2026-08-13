const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MedusaChain, MemoryStore, computeBlockHash } = require('../index');

describe('MedusaChain', () => {
  it('appends, seals and verifies', async () => {
    const chain = new MedusaChain(new MemoryStore(), { autoSeal: true });
    const out = await chain.appendEvent({
      eventId: 'pay-1',
      eventType: 'PAYMENT_CAPTURED',
      amount: 50000
    });
    assert.equal(out.duplicate, false);
    assert.ok(out.transaction);
    const verify = await chain.verifyChain();
    assert.equal(verify.valid, true);
    assert.ok(verify.blocks >= 2);
  });

  it('is idempotent by eventId', async () => {
    const chain = new MedusaChain(new MemoryStore(), { autoSeal: false });
    await chain.appendEvent({ eventId: 'x', eventType: 'ORDER_CREATED' });
    const again = await chain.appendEvent({ eventId: 'x', eventType: 'ORDER_CREATED' });
    assert.equal(again.duplicate, true);
  });

  it('computeBlockHash is stable', () => {
    const ts = new Date('2026-01-01T00:00:00.000Z');
    const a = computeBlockHash({ index: 1, timestamp: ts, previousHash: '0', txHashes: ['a'] });
    const b = computeBlockHash({ index: 1, timestamp: ts, previousHash: '0', txHashes: ['a'] });
    assert.equal(a, b);
    assert.equal(a.length, 64);
  });
});
