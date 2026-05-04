# Ticket Mock API

Mock replication of three real telecom ticket endpoints for **agent API tool testing**.

---

## Quick Start

```bash
npm install
npm start        # → http://localhost:8000
PORT=3001 npm start   # custom port
```

Open **http://localhost:8000/api-docs** for interactive Swagger UI.

---

## Project Structure

```
ticket-api/
├── server.js               # Entry point, routes, Swagger
├── package.json
├── curls.sh                # Ready-to-run cURL examples
├── middleware/
│   └── auth.js             # Mock auth (any non-empty header passes)
├── routes/
│   ├── soa.js              # GET  /DigitalService/.../troubleTicket
│   ├── categories.js       # POST /b2bSC_getCatagories/v2
│   ├── raiseTicket.js      # POST /b2bSC_raiseTicket/v1
│   ├── tickets.js          # CRUD /tickets
│   └── customers.js        # CRUD /customers
└── db/
    ├── index.js            # Read/write helpers (JSON file store)
    ├── customers.json      # Customer records (persisted)
    ├── tickets.json        # Ticket records (persisted)
    └── categories.json     # Ticket type tree (read-only)
```

---

## Authentication

All endpoints (except `/health`) require an `Authorization` header.  
Any non-empty value passes in mock mode:

```
Authorization: Bearer demo-token
```

The SOA endpoint also accepts `authCode` header. The raise-ticket endpoint accepts both `Authorization` and `authCode`.

---

## Primary Keys

| What | Key | Example |
|---|---|---|
| Identify a customer | `msisdn` (phone) or `id` | `01711234567` |
| Identify a ticket | `ticketNo` | `TT105368` |
| Ownership check | `msisdn` in query/body | `01711234567` |

`contractId` from the original spec is **replaced by `msisdn`** — the server resolves the customer internally.

---

## Endpoints

### Spec Endpoints (replicate real API)

| Method | Path | Auth header | Purpose |
|---|---|---|---|
| `GET`  | `/DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=` | `Authorization` | Get ticket status |
| `POST` | `/b2bSC_getCatagories/v2` | `Authorization` | Get ticket type tree |
| `POST` | `/b2bSC_raiseTicket/v1` | `Authorization` | Raise new ticket |

### Helper Endpoints (CRUD)

| Method | Path | Required |
|---|---|---|
| `GET`    | `/customers` | — |
| `GET`    | `/customers/:id` | id or msisdn in path |
| `POST`   | `/customers` | `customer_name`, `msisdn` |
| `PATCH`  | `/customers/:id` | id or msisdn in path |
| `DELETE` | `/customers/:id` | id or msisdn in path |
| `GET`    | `/tickets?msisdn=` | `msisdn` query param |
| `GET`    | `/tickets/:ticketNo?msisdn=` | `msisdn` query param |
| `PATCH`  | `/tickets/:ticketNo` | `msisdn` in body |
| `DELETE` | `/tickets/:ticketNo` | `msisdn` in body |

---

## Recommended Agent Flow

```
1. GET  /customers/:msisdn              → resolve customer
2. POST /b2bSC_getCatagories/v2         → get type/service/category/subCat tree
3. Agent presents choices to user
4. POST /b2bSC_raiseTicket/v1           → raise ticket (use subCategory.id as subCat)
5. GET  /DigitalService/.../troubleTicket?ticketNo=   → confirm status
```

---

## Pre-seeded Data

| msisdn | Customer | Tickets |
|---|---|---|
| 01711234567 | Rahim Uddin | TT105368 (Open) |
| 01812345678 | Fatema Begum | — |
| 01911223344 | Karim Hassan | TT193426 (Closed), TT536791 (InProgress) |
| 01755667788 | Nadia Islam | — |

---

## DB Persistence

Data is stored in `/db/*.json` files and **persists across restarts**.  
To reset to seed data, run:

```bash
git checkout db/customers.json db/tickets.json
```

Or delete the files and re-seed manually.
