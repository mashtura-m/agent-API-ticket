/**
 * Trouble Ticket Mock API Server
 * Usage: node server.js  →  http://localhost:8000
 *
 * Required identifiers:
 *  - contractId  → always required (main agent hands this to sub-agent)
 *  - ticketNo    → required for all single-ticket operations
 */

const express = require("express");
const cors    = require("cors");

let swaggerUi;
try { swaggerUi = require("swagger-ui-express"); } catch (_) {}

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// In-memory store
// ─────────────────────────────────────────────
const tickets = new Map();

function seedTicket(override = {}) {
  const base = {
    ticketNo:         `TT${Math.floor(100000 + Math.random() * 900000)}`,
    status:           "Open",
    ticketType:       "Complaint",
    priority:         "High",
    accountId:        ["1007504943"],   // accountId[0] === contractId
    description:      "title=Chatbot Ticket (test)| type=Complaint| service=Fixed| category=Network Issue| subCategoryName=Reachability| summary=testing ticket",
    category:         [{ name: "Reachability-SMC", ticketType: "Complaint", id: "TC0110211613" }],
    publicIdentifier: ["50043700"],
    note:             [{ date: "2024-12-12T06:49:30.669Z", author: "seed", text: "TEST" }],
    attachment:       [],
    customFields:     {},
    createdDate:      new Date().toISOString(),
    modifiedDate:     new Date().toISOString(),
    ...override,
  };
  tickets.set(base.ticketNo, base);
  return base;
}

seedTicket({ ticketNo: "TT105368", status: "Open",       priority: "High",   accountId: ["1007504943"] });
seedTicket({ ticketNo: "TT193426", status: "Closed",     priority: "Medium", accountId: ["1007504943"] });
seedTicket({ ticketNo: "TT536791", status: "InProgress", priority: "Low",    accountId: ["2009871234"] });

// ─────────────────────────────────────────────
// Auth (any non-empty value passes)
// ─────────────────────────────────────────────
function authCheck(req, res, next) {
  const auth = req.headers["authorization"] || req.headers["authcode"] || "";
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
  next();
}

// Returns true if contractId matches the ticket owner
function ownsTicket(ticket, contractId) {
  return Array.isArray(ticket.accountId) && ticket.accountId.includes(contractId);
}

// ─────────────────────────────────────────────
// HEALTH (no auth)
// ─────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", ticketsLoaded: tickets.size })
);

// ─────────────────────────────────────────────
// SOA: GET ticket by ticketNo
// GET /DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT105368
// ─────────────────────────────────────────────
app.get(
  "/DigitalService/TroubleTicketRestService/troubleTicket",
  authCheck,
  (req, res) => {
    const { ticketNo } = req.query;
    if (!ticketNo) return res.status(400).json({ error: "ticketNo is required" });
    const ticket = tickets.get(ticketNo);
    if (!ticket)   return res.status(404).json({ error: `Ticket ${ticketNo} not found` });
    res.json([ticket]);
  }
);

// ─────────────────────────────────────────────
// RAISE: POST new ticket
// Required: contractId, ticketType, category
// POST /b2bSC_raiseTicket/v1
// ─────────────────────────────────────────────
app.post("/b2bSC_raiseTicket/v1", authCheck, (req, res) => {
  const {
    contractId, ticketType, category,
    subCat, title, summary, subCatName,
    service, subscriberNumber, callBackNumber, supportDocsList,
  } = req.body;

  if (!contractId || !ticketType || !category) {
    return res.status(400).json({
      statusCode: "1",
      stausMessage: "Missing required fields: contractId, ticketType, category",
    });
  }

  const ticketNo = `TT${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const newTicket = {
    ticketNo,
    status:           "Open",
    ticketType,
    priority:         "High",
    accountId:        [contractId],
    description:      `title=${title || ""}| type=${ticketType}| service=${service || ""}| category=${category}| subCategoryName=${subCatName || ""}| summary=${summary || ""}`,
    category:         [{ name: subCatName ? `${subCatName}-SMC` : category, ticketType, id: subCat || "" }],
    publicIdentifier: [subscriberNumber || ""],
    callBackNumber:   callBackNumber || "",
    note:             [],
    attachment:       supportDocsList || [],
    customFields:     {},
    createdDate:      now,
    modifiedDate:     now,
  };

  tickets.set(ticketNo, newTicket);
  res.status(201).json({ statusCode: "0", stausMessage: "success", ticketNumber: ticketNo });
});

// ─────────────────────────────────────────────
// CRUD — List tickets for a contract
// Required query: contractId
// GET /tickets?contractId=1007504943
// ─────────────────────────────────────────────
app.get("/tickets", authCheck, (req, res) => {
  const { contractId } = req.query;
  if (!contractId) return res.status(400).json({ error: "contractId query param is required" });

  const result = Array.from(tickets.values()).filter(
    (t) => Array.isArray(t.accountId) && t.accountId.includes(contractId)
  );
  res.json({ contractId, total: result.length, tickets: result });
});

// ─────────────────────────────────────────────
// CRUD — Get single ticket
// Required: ticketNo (path) + contractId (query)
// GET /tickets/TT105368?contractId=1007504943
// ─────────────────────────────────────────────
app.get("/tickets/:ticketNo", authCheck, (req, res) => {
  const { contractId } = req.query;
  if (!contractId) return res.status(400).json({ error: "contractId query param is required" });

  const ticket = tickets.get(req.params.ticketNo);
  if (!ticket)                        return res.status(404).json({ error: "Ticket not found" });
  if (!ownsTicket(ticket, contractId)) return res.status(403).json({ error: "Ticket does not belong to this contractId" });

  res.json(ticket);
});

// ─────────────────────────────────────────────
// CRUD — Update ticket
// Required: ticketNo (path) + contractId (body)
// PATCH /tickets/TT105368
// ─────────────────────────────────────────────
app.patch("/tickets/:ticketNo", authCheck, (req, res) => {
  const { contractId, status, priority, note } = req.body;
  if (!contractId) return res.status(400).json({ error: "contractId is required in body" });

  const ticket = tickets.get(req.params.ticketNo);
  if (!ticket)                        return res.status(404).json({ error: "Ticket not found" });
  if (!ownsTicket(ticket, contractId)) return res.status(403).json({ error: "Ticket does not belong to this contractId" });

  if (status)   ticket.status   = status;
  if (priority) ticket.priority = priority;
  if (note)     ticket.note.push({ date: new Date().toISOString(), author: "api-agent", text: note });
  ticket.modifiedDate = new Date().toISOString();

  tickets.set(req.params.ticketNo, ticket);
  res.json({ message: "Ticket updated", ticket });
});

// ─────────────────────────────────────────────
// CRUD — Delete ticket
// Required: ticketNo (path) + contractId (body)
// DELETE /tickets/TT105368
// ─────────────────────────────────────────────
app.delete("/tickets/:ticketNo", authCheck, (req, res) => {
  const { contractId } = req.body;
  if (!contractId) return res.status(400).json({ error: "contractId is required in body" });

  const ticket = tickets.get(req.params.ticketNo);
  if (!ticket)                        return res.status(404).json({ error: "Ticket not found" });
  if (!ownsTicket(ticket, contractId)) return res.status(403).json({ error: "Ticket does not belong to this contractId" });

  tickets.delete(req.params.ticketNo);
  res.json({ message: `Ticket ${req.params.ticketNo} deleted` });
});

// ─────────────────────────────────────────────
// Swagger
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Trouble Ticket Mock API",
    version: "1.0.0",
    description: "contractId + ticketNo always required. Pre-seeded: TT105368, TT193426 (contractId 1007504943) | TT536791 (contractId 2009871234)",
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  components: {
    securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
    schemas: {
      Ticket: {
        type: "object",
        properties: {
          ticketNo:    { type: "string" },
          status:      { type: "string", enum: ["Open","InProgress","Closed","Cancelled"] },
          ticketType:  { type: "string" },
          priority:    { type: "string", enum: ["Low","Medium","High","Critical"] },
          accountId:   { type: "array", items: { type: "string" }, description: "accountId[0] === contractId" },
          description: { type: "string" },
          createdDate: { type: "string", format: "date-time" },
          modifiedDate:{ type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/health": {
      get: { tags: ["Util"], summary: "Health check (no auth)", responses: { 200: { description: "OK" } } },
    },
    "/DigitalService/TroubleTicketRestService/troubleTicket": {
      get: {
        tags: ["SOA"],
        summary: "Get ticket by ticketNo",
        parameters: [{ name: "ticketNo", in: "query", required: true, schema: { type: "string", example: "TT105368" } }],
        responses: { 200: { description: "Ticket array" }, 404: { description: "Not found" } },
      },
    },
    "/b2bSC_raiseTicket/v1": {
      post: {
        tags: ["Raise Ticket"],
        summary: "Create a new ticket",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contractId", "ticketType", "category"],
                properties: {
                  contractId: { type: "string", example: "1007504943" },
                  ticketType: { type: "string", example: "Complaint" },
                  category:   { type: "string", example: "Network Issue" },
                  subCatName: { type: "string", example: "Reachability" },
                  summary:    { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" }, 400: { description: "Missing required fields" } },
      },
    },
    "/tickets": {
      get: {
        tags: ["CRUD"],
        summary: "List all tickets for a contract",
        parameters: [{ name: "contractId", in: "query", required: true, schema: { type: "string", example: "1007504943" } }],
        responses: { 200: { description: "Ticket list" }, 400: { description: "contractId missing" } },
      },
    },
    "/tickets/{ticketNo}": {
      get: {
        tags: ["CRUD"],
        summary: "Get one ticket",
        parameters: [
          { name: "ticketNo",   in: "path",  required: true, schema: { type: "string", example: "TT105368" } },
          { name: "contractId", in: "query", required: true, schema: { type: "string", example: "1007504943" } },
        ],
        responses: { 200: { description: "Ticket" }, 403: { description: "Wrong contract" }, 404: { description: "Not found" } },
      },
      patch: {
        tags: ["CRUD"],
        summary: "Update ticket",
        parameters: [{ name: "ticketNo", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contractId"],
                properties: {
                  contractId: { type: "string", example: "1007504943" },
                  status:     { type: "string", enum: ["Open","InProgress","Closed","Cancelled"] },
                  priority:   { type: "string", enum: ["Low","Medium","High","Critical"] },
                  note:       { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated" }, 403: { description: "Wrong contract" } },
      },
      delete: {
        tags: ["CRUD"],
        summary: "Delete ticket",
        parameters: [{ name: "ticketNo", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contractId"],
                properties: { contractId: { type: "string", example: "1007504943" } },
              },
            },
          },
        },
        responses: { 200: { description: "Deleted" }, 403: { description: "Wrong contract" } },
      },
    },
  },
};

if (swaggerUi) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
app.get("/swagger.json", (req, res) => res.json(swaggerSpec));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Trouble Ticket Mock API  →  http://localhost:${PORT}`);
  console.log(`   /health     – no auth`);
  console.log(`   /api-docs   – Swagger UI`);
  console.log(`\n📋 Pre-seeded tickets:`);
  console.log(`   TT105368 (Open)       contractId 1007504943`);
  console.log(`   TT193426 (Closed)     contractId 1007504943`);
  console.log(`   TT536791 (InProgress) contractId 2009871234\n`);
});
