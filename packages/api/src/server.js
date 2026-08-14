const http = require('http');
const { URL } = require('url');
const { MedusaChain, MemoryStore } = require('../../core');

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (_) {
    return {};
  }
}

function send(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(raw)
  });
  res.end(raw);
}

function formatEventResponse(out) {
  const tx = out.transaction || {};
  const block = out.block;
  return {
    success: true,
    duplicate: Boolean(out.duplicate),
    eventId: tx.eventId,
    eventType: tx.eventType,
    block: block ? block.index : tx.blockIndex,
    hash: block ? block.hash : tx.payloadHash,
    transaction: tx,
    sealedBlock: block || null
  };
}

async function formatLedgerShow(chain) {
  const blocks = await chain.listBlocks({ limit: 200 });
  const asc = [...blocks].sort((a, b) => a.index - b.index);
  const lines = ['MEDUSA LEDGER', ''];
  for (const b of asc) {
    const txs = await chain.listTransactions({ blockIndex: b.index, limit: 20 });
    lines.push(`Block #${b.index}`);
    if (b.index === 0) lines.push('GENESIS');
    else if (txs[0]) lines.push(`${txs[0].eventType}  eventId: ${txs[0].eventId}`);
    lines.push(`previousHash: ${String(b.previousHash).slice(0, 12)}...`);
    lines.push(`hash: ${String(b.hash).slice(0, 12)}...`);
    lines.push('');
    lines.push('        ↓');
    lines.push('');
  }
  const verify = await chain.verifyChain();
  lines.push(verify.valid ? '✓ CHAIN VALID' : `✗ CHAIN INVALID (${verify.reason || verify.error})`);
  return { valid: verify.valid, blocks: asc.length, text: lines.join('\n'), verify };
}

function createServer(chain) {
  return http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const path = u.pathname.replace(/\/$/, '') || '/';
      const method = (req.method || 'GET').toUpperCase();

      if (method === 'GET' && path === '/health') {
        return send(res, 200, { ok: true, product: 'medusa-ledger', version: '0.1.0' });
      }
      if (method === 'GET' && path === '/api/summary') {
        return send(res, 200, { summary: await chain.getSummary() });
      }
      if (method === 'GET' && path === '/api/blocks') {
        return send(res, 200, { blocks: await chain.listBlocks({ limit: u.searchParams.get('limit') }) });
      }
      if (method === 'GET' && path === '/api/transactions') {
        return send(res, 200, {
          transactions: await chain.listTransactions({
            status: u.searchParams.get('status'),
            blockIndex: u.searchParams.get('blockIndex'),
            limit: u.searchParams.get('limit')
          })
        });
      }
      if (method === 'GET' && (path === '/api/verify' || path === '/api/ledger/verify')) {
        return send(res, 200, await chain.verifyChain());
      }
      if (method === 'GET' && (path === '/api/ledger' || path === '/api/ledger/show')) {
        return send(res, 200, await formatLedgerShow(chain));
      }
      if (method === 'POST' && path === '/api/seal') {
        const body = await readJson(req);
        return send(res, 200, await chain.sealPending({ maxTx: body.maxTx }));
      }
      if (method === 'POST' && path === '/api/events') {
        const body = await readJson(req);
        try {
          const out = await chain.appendEvent(body || {});
          return send(res, out.duplicate ? 200 : 201, formatEventResponse(out));
        } catch (e) {
          const status = e.code === 'EVENT_ID_REQUIRED' ? 400 : 500;
          return send(res, status, { success: false, error: e.code || 'SERVER_ERROR', message: e.message });
        }
      }
      return send(res, 404, { error: 'NOT_FOUND' });
    } catch (e) {
      return send(res, 500, { error: 'SERVER_ERROR', message: e.message });
    }
  });
}

function main() {
  const port = Number(process.env.PORT || 8080);
  const autoSeal = String(process.env.MEDUSA_AUTO_SEAL_ON_EVENT || '1') !== '0';
  const chain = new MedusaChain(new MemoryStore(), { autoSeal, ledgerId: 'oss-demo' });
  const server = createServer(chain);
  server.listen(port, () => {
    console.log(`[medusa-ledger] listening on :${port}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { createServer, main, formatEventResponse, formatLedgerShow };
