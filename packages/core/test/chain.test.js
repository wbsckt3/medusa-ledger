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

  it('canonicalJson sorts object keys', () => {
    const { canonicalJson, hashPayload } = require('../index');
    const h1 = hashPayload({ b: 1, a: 2 });
    const h2 = hashPayload({ a: 2, b: 1 });
    assert.equal(h1, h2);
    assert.ok(canonicalJson({ z: 1, a: 2 }).startsWith('{"a":'));
  });

  it('FileStore persists and verifies', async () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { FileStore } = require('../index');
    const dir = path.join(os.tmpdir(), `medusa-test-${Date.now()}`);
    const chain = new MedusaChain(new FileStore(dir), { autoSeal: true });
    await chain.appendEvent({
      eventId: 'order-001',
      eventType: 'ORDER_CREATED',
      payload: { amount: 50000, currency: 'COP' }
    });
    await chain.appendEvent({
      eventId: 'payment-001',
      eventType: 'PAYMENT_RECEIVED',
      payload: { orderId: 'order-001', amount: 50000 }
    });
    const verify = await chain.verifyChain();
    assert.equal(verify.valid, true);
    assert.ok(fs.existsSync(path.join(dir, 'blocks', '000001.json')));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
