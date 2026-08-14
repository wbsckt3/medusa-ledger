# Medusa Ledger

**Open Source Trust Ledger for Business**

Append-only SHA-256 ledger for verifiable financial and operational events.
You define the event. Medusa makes it verifiable.

- Docs / landing: https://wbsckt3.github.io/medusa-ledger/
- Developer guide: https://wbsckt3.github.io/medusa-ledger/developers.html
- Manual: https://wbsckt3.github.io/medusa-ledger/manual.html
- Cloud product: https://wbsckt3.github.io/medusa-ledger-business/
- Sponsors: https://github.com/sponsors/wbsckt3

> Not affiliated with MedusaJS e-commerce. Scope: `@medusa-ledger/*`.

## What is an event?

An event is a fact that happened in your system and that you want to prove later was recorded exactly as stored.

Medusa does not need to understand your business. It turns:

```text
eventId + eventType + payload
        ↓
     SHA-256
        ↓
      BLOCK
        ↓
      CHAIN
        ↓
      VERIFY
```

## Quick start (Docker)

```bash
git clone https://github.com/wbsckt3/medusa-ledger.git
cd medusa-ledger
docker compose up --build
```

API on `http://localhost:8080`.

### 1) Create a business event

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "order-001",
    "eventType": "ORDER_CREATED",
    "payload": {
      "customerId": "customer-42",
      "amount": 50000,
      "currency": "COP"
    }
  }'
```

### 2) Append another fact

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "payment-001",
    "eventType": "PAYMENT_RECEIVED",
    "payload": {
      "orderId": "order-001",
      "amount": 50000,
      "currency": "COP"
    }
  }'
```

### 3) Verify integrity (magic moment)

```bash
curl http://localhost:8080/api/verify
```

```json
{ "valid": true, "blocks": 3, "message": "Ledger integrity verified" }
```

### 4) See the chain

```bash
curl http://localhost:8080/api/ledger/show
```

Or CLI (with API running):

```bash
node bin/medusa.js event create --type ORDER_CREATED --id order-002 --amount 12000
node bin/medusa.js ledger show
node bin/medusa.js ledger verify
```

Without Docker:

```bash
node packages/api/src/server.js
```

## Packages

| Package | Role |
|---|---|
| `@medusa-ledger/core` | Hash, chain engine, `MemoryStore`, pluggable `LedgerStore` |
| `@medusa-ledger/api` | HTTP: events / verify / ledger/show / seal / blocks |
| `@medusa-ledger/sdk` | Minimal JS client |
| `bin/medusa.js` | CLI demo |

## Core vs Cloud

| Medusa Core (this repo) | Medusa Cloud (commercial) |
|---|---|
| Single ledger per instance | Multi-tenant / white-label (P2L n-1-n) |
| Your own events | Business events + payment anchors |
| CLI / API | Dashboard + ERP / IA |

## License

Apache-2.0
