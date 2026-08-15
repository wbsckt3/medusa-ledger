<img width="223" height="207" alt="0  medusa-logo" src="https://github.com/user-attachments/assets/56a2efb5-6fb2-4f55-9146-6ff5f112c34c" />


# Medusa Ledger

**Open Source Trust Ledger for Business**

Append-only SHA-256 ledger for verifiable business events.
**You define the event. Medusa makes it verifiable.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/open--source-Apache--2.0-brightgreen.svg)](LICENSE)

> Medusa does not replace your ERP.
> Your operational database stores state. **Medusa stores evidence.**

---

## What is Medusa?

Business systems generate thousands of events:

* orders
* payments
* invoices
* approvals
* deliveries
* inventory changes
* commissions
* transfers
* operational events

Later, you may need to answer:

> **Was this event recorded exactly as it happened?**

Medusa provides an append-only, tamper-evident ledger for those events.

It does not need to understand your business semantics.

You provide:

```text
eventId + eventType + payload
            ↓
       canonical JSON
            ↓
          SHA-256
            ↓
           BLOCK
            ↓
          CHAIN
            ↓
          VERIFY
```

The application remains responsible for business logic.

**Medusa provides the evidence layer.**

---

## Why Medusa?

Traditional business applications normally separate:

```text
Application
     ↓
Operational Database
     ↓
Reports
```

Medusa adds an evidence layer:

```text
Business Application
        │
        ├──────────────→ Operational DB
        │                  state
        │
        └──────────────→ Medusa Ledger
                           evidence
                              ↓
                         SHA-256 chain
                              ↓
                            VERIFY
```

This means your ERP, CRM, payment system or custom application does not have to become a blockchain application.

It simply records the events that matter.

---

# Core vs Cloud

Medusa follows an open-core model.

## Medusa Core — Open Source

This repository contains the open-source ledger engine:

* append-only ledger
* SHA-256 hashing
* canonical payload hashing
* blocks and chains
* integrity verification
* `MemoryStore`
* `FileStore`
* pluggable `LedgerStore`
* HTTP API
* JavaScript SDK
* CLI
* Docker
* protocol specification

Licensed under **Apache-2.0**.

## Medusa Cloud — Commercial

The commercial layer adds capabilities such as:

* multi-tenant ledgers
* white-label business units
* payment anchors
* analytics hubs
* ERP integrations
* real-time dashboards
* operational tooling
* SLA and enterprise services

The open-source Core remains available independently.

---

# Quick Start

## Option 1 — Node.js

Install the Core:

```bash
npm install @medusa-ledger/core
```

Create a ledger:

```javascript
const { MedusaChain, FileStore } = require("@medusa-ledger/core");

const chain = new MedusaChain(
  new FileStore("./ledger"),
  { autoSeal: true }
);

await chain.appendEvent({
  eventId: "order-001",
  eventType: "ORDER_CREATED",
  payload: {
    customerId: "customer-42",
    amount: 50000,
    currency: "COP"
  }
});

console.log(await chain.verifyChain());
```

Expected result:

```text
Ledger integrity verified
```

---

# Option 2 — Docker

Clone the repository:

```bash
git clone https://github.com/wbsckt3/medusa-ledger.git
cd medusa-ledger
```

Start the stack:

```bash
docker compose up --build
```

The API will be available on:

```text
http://localhost:8080
```

Create an event:

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

Add another event:

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

Now verify the ledger:

```bash
curl http://localhost:8080/api/verify
```

Example:

```json
{
  "valid": true,
  "blocks": 3,
  "message": "Ledger integrity verified"
}
```

### This is the Medusa moment

```text
Business event
      ↓
SHA-256
      ↓
Block
      ↓
Chain
      ↓
Verification
      ↓
Evidence
```

---

# Protocol

The Medusa protocol is defined in:

**[SPEC.md](SPEC.md)**

The specification defines:

* event structure
* canonical JSON
* payload hashing
* block structure
* block hashing
* genesis block
* verification
* storage modes
* HTTP API
* cross-stack compatibility

The Node implementation is the reference implementation for the current protocol version.

---

# Architecture

```text
                         BUSINESS APPLICATION
                                  │
                  ┌───────────────┴───────────────┐
                  │                               │
             Operational DB                  MEDUSA LEDGER
           MongoDB / Postgres                    │
                  │                               │
                STATE                         EVIDENCE
                                                  │
                                            SHA-256
                                                  │
                                               BLOCK
                                                  │
                                               CHAIN
                                                  │
                                              VERIFY
```

Medusa intentionally separates:

**business state** from **business evidence**.

Your operational database can continue to use MongoDB, PostgreSQL, SQL Server or another database.

Medusa does not need to replace it.

---

# Storage Modes

## Embedded

Node applications can embed the ledger directly:

```text
Application
    │
    └── @medusa-ledger/core
             │
          FileStore
             │
        ./ledger/blocks
```

## Sidecar

Any language can communicate with the Medusa HTTP API:

```text
Java / .NET / Python / Go / Node / PHP / ...
                    │
                    ▼
             Medusa HTTP API
                    │
                    ▼
              Ledger Store
```

## Cloud

The commercial platform provides managed, multi-tenant ledgers:

```text
Business Unit
      │
      ▼
Medusa Cloud
      │
      ├── isolated ledger
      ├── payment anchors
      ├── realtime hub
      └── business integrations
```

---

# Packages

| Package               | Purpose                           |
| --------------------- | --------------------------------- |
| `@medusa-ledger/core` | Hashing, chain engine and storage |
| `@medusa-ledger/api`  | HTTP API                          |
| `@medusa-ledger/sdk`  | Minimal JavaScript client         |
| `bin/medusa.js`       | CLI                               |
| `packages/spring/`    | Spring Boot integration           |
| `packages/dotnet/`    | .NET integration roadmap          |

---

# Cross-Stack Strategy

Medusa is designed to be consumed from different technology stacks.

```text
                    MEDUSA PROTOCOL
                           │
          ┌────────────────┼────────────────┐
          │                │                │
        Node           Spring Boot        .NET
          │                │                │
      Embedded          HTTP API          HTTP API
       Core             Sidecar           Sidecar
```

The protocol defines the hashing and verification rules so implementations can converge on the same ledger semantics.

---

# Medusa in Production

Medusa is not only an isolated open-source experiment.

The Core is also being used as the foundation for commercial and white-label business infrastructure.

One example is **Tuk-Tuk**, a P2L business unit where confirmed payments can generate ledger anchors for the corresponding business events.

The commercial Medusa platform is designed around:

```text
Business Unit
      ↓
Operational transaction
      ↓
Payment / event
      ↓
Medusa
      ↓
SHA-256 ledger
      ↓
Verification
      ↓
Realtime / BI / AI
```

---

# Commercial Ecosystem

Medusa Core is the open-source infrastructure.

Around it, the broader P2L / Refactorii ecosystem contains commercial applications and white-label products.

These products are **not part of this repository**. They demonstrate the infrastructure and product ecosystem being built around the same platform.

## Medusa Cloud

**Trust Ledger as a Service**

Multi-tenant business ledgers, payment anchors, dashboards, realtime hubs and ERP integrations.

→ Medusa Cloud / Business

---

## Tuk-Tuk Mobility

**White-label mobility platform**

A real business-unit implementation of the P2L platform and a production-oriented Medusa integration example.

→ Tuk-Tuk Mobility

---

## AvlMonitor

**Real-time fleet georeferencing for local Windows infrastructure**

A .NET WPF application that connects organizational SQL Server data with live map visualization and P2L licensing.

→ AvlMonitor

---

## SECOP Business Intelligence

**Commercial intelligence for public procurement**

A verticalized SECOP II monitoring platform with UNSPSC presets, automated searches, Telegram alerts and enterprise monitoring.

→ SECOP Intelligence

---

## SEO + Content Coverage Engine

**AI-powered SEO and content coverage**

A commercial Coverage Engine that combines Search Console data, crawling, competitor analysis, content gaps, SEO coverage and AI-generated roadmaps.

→ Coverage Engine

---

# The Ecosystem

```text
                         REFRACTORII / P2L
                                │
             ┌──────────────────┴──────────────────┐
             │                                     │
      OPEN SOURCE CORE                       COMMERCIAL APPS
             │                                     │
      MEDUSA LEDGER                              P2L
             │                                     │
      ┌──────┼──────┐                ┌────────────┼────────────┐
      │      │      │                │            │            │
     npm   Docker  HTTP          Tuk-Tuk      AvlMonitor    Coverage
      │      │      │                           │            Engine
      │      │      │                         SECOP BI
      └──────┴──────┘
             │
        Medusa Cloud
             │
       Multi-tenant
       White-label
       Enterprise
```

The goal is simple:

> **Open source makes the infrastructure accessible.
> Commercial products turn the infrastructure into business value.**

---

# Documentation

* **Open Source Landing / SPEC**
* **Developer Guide**
* **API Manual**
* **Storage Specification**
* **Installation Specification**
* **Medusa Cloud**

The canonical protocol remains `SPEC.md` in this repository.

---

# Roadmap

## v0.1

* [x] SHA-256 ledger
* [x] Append-only events
* [x] Chain verification
* [x] FileStore
* [x] MemoryStore
* [x] HTTP API
* [x] Docker
* [x] JavaScript SDK
* [x] CLI
* [x] Protocol specification
* [x] Spring Boot HTTP integration

## Next

* [ ] Native Spring Boot implementation
* [ ] Stable SDK contracts
* [ ] .NET client
* [ ] Additional storage adapters
* [ ] Automated test suite
* [ ] GitHub Actions CI
* [ ] Versioned protocol releases
* [ ] Signed releases
* [ ] More language clients

---

# Open Source vs Commercial

| Capability               | Medusa Core | Medusa Cloud |
| ------------------------ | :---------: | :----------: |
| Append-only ledger       |      ✓      |       ✓      |
| SHA-256 verification     |      ✓      |       ✓      |
| Events                   |      ✓      |       ✓      |
| FileStore                |      ✓      |       ✓      |
| Docker                   |      ✓      |       ✓      |
| SDK                      |      ✓      |       ✓      |
| HTTP API                 |      ✓      |       ✓      |
| Multi-tenant             |      —      |       ✓      |
| White-label              |      —      |       ✓      |
| Payment anchors          |      —      |       ✓      |
| Business dashboards      |      —      |       ✓      |
| ERP integrations         |      —      |       ✓      |
| Managed infrastructure   |      —      |       ✓      |
| SLA / Enterprise support |      —      |       ✓      |

---

# Sponsor the Project

Medusa Ledger is open source and available under Apache-2.0.

If you use Medusa, find the project useful, or want to support the development of open-source trust infrastructure, consider sponsoring the maintainer.

**GitHub Sponsors:** `@wbsckt3`

Sponsors help fund:

* protocol development
* SDKs and integrations
* documentation
* testing
* security
* new language implementations
* long-term open-source maintenance

---

# Contributing

Contributions are welcome.

Useful areas include:

* protocol review
* tests
* storage adapters
* SDKs
* Spring Boot integration
* .NET integration
* documentation
* examples
* security review

Before implementing a new protocol behavior, review `SPEC.md`.

---

# License

Apache-2.0

---

## Medusa Ledger

**Open Source Trust Ledger for Business**

You define the event.

**Medusa makes it verifiable.**

