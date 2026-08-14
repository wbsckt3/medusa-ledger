# Medusa Ledger Protocol (SPEC v0.1)

**You define the event. Medusa makes it verifiable.**

This document is the canonical protocol for `@medusa-ledger/core` (Node reference implementation).
Spring Boot and .NET clients in v0.1 use HTTP against the Docker sidecar; native hash implementations follow in v1.1.

## Event

```json
{
  "eventId": "order-001",
  "eventType": "ORDER_CREATED",
  "timestamp": "2026-08-14T12:00:00.000Z",
  "payload": { "customerId": "c-42", "amount": 50000, "currency": "COP" },
  "metadata": {}
}
```

| Field | Required | Notes |
|---|---|---|
| `eventId` | yes | Unique per ledger; idempotent re-append returns duplicate |
| `eventType` | yes | Domain string (`ORDER_CREATED`, `PAYMENT_RECEIVED`, …) |
| `payload` | recommended | Business fact; hashed, not interpreted |
| `payloadHash` | optional | Precomputed; else `hashPayload(payload)` |
| `metadata` | optional | Non-hashed hints |

Medusa does **not** need to understand business semantics.

## Payload hash

```
payloadHash = SHA256( canonicalJSON(payload) )
```

`canonicalJSON`: object keys sorted lexicographically; arrays preserve order; primitives via JSON.stringify rules.

## Block

```json
{
  "index": 1,
  "timestamp": "2026-08-14T12:00:01.000Z",
  "previousHash": "<hash of block index-1>",
  "hash": "<computed>",
  "txCount": 1,
  "transactionIds": ["tx-1"]
}
```

Genesis block: `index=0`, `previousHash="0"`, `txHashes=["GENESIS"]`.

## Block hash

```
body = index + "|" + ISO8601(timestamp) + "|" + previousHash + "|" + txHashes.join(",")
hash = SHA256(body)
```

`txHashes` for sealed blocks = ordered `payloadHash` of sealed transactions (creation order).

## Verify response

```json
{ "valid": true, "blocks": 3, "message": "Ledger integrity verified" }
```

On tampering:

```json
{ "valid": false, "block": 2, "reason": "Hash mismatch", "message": "Hash mismatch" }
```

## Storage modes

| Mode | Store | Use case |
|---|---|---|
| Embedded | `FileStore` (`./ledger/blocks/`) | NPM in-process |
| Sidecar | Docker volume + HTTP API | Any language |
| Cloud | `MongoTenantStore` | P2L multi-tenant |

Operational DB (Mongo, Postgres, …) holds **state**. Medusa holds **evidence**. They are separate.

## HTTP API (sidecar)

| Method | Path | Action |
|---|---|---|
| POST | `/api/events` | Append event |
| GET | `/api/verify` | Verify chain |
| GET | `/api/ledger/show` | Human-readable chain |
| GET | `/api/blocks` | List blocks |
| POST | `/api/seal` | Seal pending manually |

## Cross-stack (v0.1)

- **Node**: `@medusa-ledger/core` + `FileStore` or `MemoryStore`
- **Docker**: `docker compose up` → HTTP on `:8080`
- **Spring Boot**: HTTP client (Maven/Gradle) → sidecar
- **.NET**: stub + HTTP client roadmap

All stacks must produce identical hashes when using the same canonical rules (Node is reference).

## License

Apache-2.0
