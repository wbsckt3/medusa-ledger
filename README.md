<img width="223" height="207" alt="medusa-logo" src="https://github.com/user-attachments/assets/3942361c-bf29-425c-bc10-7911f7ca0b37" />

# Medusa Ledger

**Open Source Trust Ledger for Business**

Append-only SHA-256 ledger for verifiable financial and operational events.
The ERP records what happened. Medusa proves what happened.

- Docs / landing: https://wbsckt3.github.io/medusa-ledger/
- Manual: https://wbsckt3.github.io/medusa-ledger/manual.html
- Cloud product (multi-tenant): https://wbsckt3.github.io/medusa-ledger-business/
- Sponsors: https://github.com/sponsors/wbsckt3

> Not affiliated with MedusaJS e-commerce. npm scope planned: `@medusa-ledger/*`.

## Event flow

```text
ORDER_CREATED
      ↓
PAYMENT_AUTHORIZED
      ↓
PAYMENT_CAPTURED
      ↓
COMMISSION_CALCULATED
      ↓
SETTLEMENT_CREATED
      ↓
SHA-256 BLOCK
      ↓
VERIFIABLE
```

## Quick start

```bash
git clone https://github.com/wbsckt3/medusa-ledger.git
cd medusa-ledger
docker compose up --build
```

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{"eventId":"pay-1","eventType":"PAYMENT_CAPTURED","amount":50000}'

curl http://localhost:8080/api/verify
```

Without Docker:

```bash
cd packages/api && npm install
npm start
```

## Packages

| Package | Role |
|---|---|
| `@medusa-ledger/core` | Hash, chain engine, `MemoryStore`, pluggable `LedgerStore` |
| `@medusa-ledger/api` | HTTP: events / seal / blocks / verify |
| `@medusa-ledger/sdk` | Minimal JS client |

## Core vs Cloud

| Medusa Core (this repo) | Medusa Cloud (commercial) |
|---|---|
| Single ledger per instance | Multi-tenant / white-label (P2L n-1-n) |
| Generic events API | Payment anchors, analytics hubs |
| Memory / file store demo | Mongo per tenant |
| Apache-2.0 | Hosted SLA / enterprise |

P2L n-1-n keeps **one isolated chain per business unit** by wrapping this Core with a tenant-scoped Mongo adapter — Cloud stays commercial; Core stays open.

## License

Apache-2.0
