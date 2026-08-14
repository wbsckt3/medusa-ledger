#!/usr/bin/env node
/**
 * Minimal CLI for Medusa Ledger OSS demo.
 * Usage:
 *   node bin/medusa.js event create --type ORDER_CREATED --id order-001 --payload '{"amount":50000}'
 *   node bin/medusa.js ledger verify
 *   node bin/medusa.js ledger show
 */
const BASE = String(process.env.MEDUSA_URL || 'http://localhost:8080').replace(/\/$/, '');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return fallback;
  return process.argv[i + 1];
}

async function req(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(data.message || data.error || `HTTP ${res.status}`);
    process.exit(1);
  }
  return data;
}

async function main() {
  const [, , cmd, sub] = process.argv;
  if (cmd === 'event' && sub === 'create') {
    const eventType = arg('--type', 'ORDER_CREATED');
    const eventId = arg('--id', `evt-${Date.now()}`);
    const amount = arg('--amount', null);
    let payload = {};
    try {
      payload = JSON.parse(arg('--payload', '{}'));
    } catch (_) {
      payload = {};
    }
    if (amount != null) payload.amount = Number(amount);
    const body = { eventId, eventType, payload, amount: payload.amount };
    const out = await req('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    console.log('✓ Event appended\n');
    console.log(`Event:     ${out.eventType}`);
    console.log(`ID:        ${out.eventId}`);
    console.log(`Block:     ${out.block}`);
    console.log(`Hash:      ${String(out.hash || '').slice(0, 16)}...`);
    return;
  }
  if (cmd === 'ledger' && sub === 'verify') {
    const out = await req('/api/verify');
    console.log(out.valid ? 'LEDGER VALID' : 'LEDGER INVALID');
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  if (cmd === 'ledger' && sub === 'show') {
    const out = await req('/api/ledger/show');
    console.log(out.text || JSON.stringify(out, null, 2));
    return;
  }
  console.log(`Medusa Ledger CLI

  node bin/medusa.js event create --type ORDER_CREATED --id order-001 --amount 50000
  node bin/medusa.js ledger verify
  node bin/medusa.js ledger show

MEDUSA_URL=${BASE}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
