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
      if (method === 'GET' && path === '/api/verify') {
        return send(res, 200, await chain.verifyChain());
      }
      if (method === 'POST' && path === '/api/seal') {
        const body = await readJson(req);
        return send(res, 200, await chain.sealPending({ maxTx: body.maxTx }));
      }
      if (method === 'POST' && path === '/api/events') {
        const body = await readJson(req);
        try {
          const out = await chain.appendEvent(body || {});
          return send(res, out.duplicate ? 200 : 201, out);
        } catch (e) {
          const status = e.code === 'EVENT_ID_REQUIRED' ? 400 : 500;
          return send(res, status, { error: e.code || 'SERVER_ERROR', message: e.message });
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

module.exports = { createServer, main };
