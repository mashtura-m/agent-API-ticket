/**
 * Ticket Mock API Server
 * ──────────────────────
 * Replicates: SOA TroubleTicketRestService + b2bSC_getCatagories + b2bSC_raiseTicket
 * DB: JSON files in /db — persists across restarts
 * Auth: any non-empty Authorization or authCode header
 *
 * Usage:
 *   npm install
 *   node server.js          # default port 8000
 *   PORT=3000 node server.js
 */

const express    = require("express");
const cors       = require("cors");
const auth       = require("./middleware/auth");

let swaggerUi;
try { swaggerUi = require("swagger-ui-express"); } catch (_) {
  console.warn("⚠  swagger-ui-express not installed — run: npm install");
}

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
const customersRouter   = require("./routes/customers");
const soaRouter         = require("./routes/soa");
const categoriesRouter  = require("./routes/categories");
const raiseTicketRouter = require("./routes/raiseTicket");
const ticketsRouter     = require("./routes/tickets");

// Health — no auth required
app.get("/health", (req, res) => {
  const db = require("./db");
  res.json({
    status:    "ok",
    customers: db.getCustomers().length,
    tickets:   db.getTickets().length,
  });
});

// Customer lookup helpers — auth required
app.use("/customers", auth, customersRouter);

// SOA endpoint (exact spec path)
app.use("/DigitalService/TroubleTicketRestService", auth, soaRouter);

// Ticket types tree
app.use("/b2bSC_getCatagories/v2", auth, categoriesRouter);

// Raise ticket
app.use("/b2bSC_raiseTicket/v1", auth, raiseTicketRouter);

// Ticket CRUD
app.use("/tickets", auth, ticketsRouter);

// ── Swagger ───────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

const spec = {
  openapi: "3.0.0",
  info: {
    title:   "Ticket Mock API",
    version: "3.0.0",
    description: [
      "Mock replication of three real endpoints:",
      "- **SOA** `GET /DigitalService/TroubleTicketRestService/troubleTicket`",
      "- **API** `POST /b2bSC_getCatagories/v2` — ticket type tree",
      "- **API** `POST /b2bSC_raiseTicket/v1` — raise ticket",
      "",
      "Plus CRUD helpers for customers and tickets.",
      "",
      "**Auth**: any non-empty `Authorization: Bearer <anything>` header passes.",
      "",
      "**Primary keys**:",
      "- Customers → `msisdn` (phone number) or `id`",
      "- Tickets → `ticketNo` + `msisdn` for ownership check",
      "",
      "**Pre-seeded data**:",
      "| msisdn | customer | tickets |",
      "|---|---|---|",
      "| 01711234567 | Rahim Uddin   | TT105368 |",
      "| 01812345678 | Fatema Begum  | — |",
      "| 01911223344 | Karim Hassan  | TT193426, TT536791 |",
      "| 01755667788 | Nadia Islam   | — |",
    ].join("\n"),
  },
  servers: [{ url: `http://localhost:${PORT}`, description: "Local" }],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer" },
      BasicAuth:  { type: "http", scheme: "basic" },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {

    // ── Health ──────────────────────────────────────────────────
    "/health": {
      get: { tags: ["Util"], summary: "Health check (no auth)",
        responses: { 200: { description: "Status + record counts" } } },
    },

    // ── Customers ───────────────────────────────────────────────
    "/customers": {
      get:  { tags: ["Customers"], summary: "List all customers",
        responses: { 200: { description: "Array of customers" } } },
      post: { tags: ["Customers"], summary: "Create customer",
        requestBody: { required: true, content: { "application/json": {
          schema: { type: "object", required: ["customer_name", "msisdn"],
            properties: {
              customer_name: { type: "string", example: "Ahmed Ali" },
              msisdn:        { type: "string", example: "01911000001" },
              package_name:  { type: "string", example: "Go 12" },
              package_type:  { type: "string", enum: ["prepaid","postpaid"] },
            },
          },
        }}},
        responses: { 201: { description: "Customer created" }, 409: { description: "msisdn already exists" } },
      },
    },
    "/customers/{id}": {
      get: { tags: ["Customers"], summary: "Get customer by id or msisdn",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "01711234567" } }],
        responses: { 200: { description: "Customer" }, 404: { description: "Not found" } } },
      patch: { tags: ["Customers"], summary: "Update customer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object",
          properties: {
            current_balance: { type: "number" },
            package_name:    { type: "string" },
            data_quota_mb:   { type: "number" },
          }}}}},
        responses: { 200: { description: "Updated" } } },
      delete: { tags: ["Customers"], summary: "Delete customer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Deleted" } } },
    },

    // ── SOA ─────────────────────────────────────────────────────
    "/DigitalService/TroubleTicketRestService/troubleTicket": {
      get: { tags: ["SOA — Ticket Status"], summary: "Get ticket by ticketNo",
        description: "Exact replica of the real SOA endpoint. Returns array with one ticket object.",
        parameters: [
          { name: "ticketNo", in: "query", required: true, schema: { type: "string", example: "TT105368" } },
          { name: "Version",             in: "header", schema: { type: "string", default: "1" } },
          { name: "SequenceId",          in: "header", schema: { type: "string", default: "1" } },
          { name: "TransactionId",       in: "header", schema: { type: "string", default: "1" } },
          { name: "SenderHostName",      in: "header", schema: { type: "string", default: "127.0.0.1" } },
          { name: "SerialNo",            in: "header", schema: { type: "string", default: "21212122" } },
          { name: "CreationTimeStamp",   in: "header", schema: { type: "string", default: "20200518104100" } },
          { name: "DeliveryChannelType", in: "header", schema: { type: "string", default: "B2BBOT" } },
          { name: "RequestType",         in: "header", schema: { type: "string", default: "Event" } },
          { name: "BusinessProcessId",   in: "header", schema: { type: "string", default: "getIndividualCustomerProfile" } },
          { name: "OperatorId",          in: "header", schema: { type: "string", default: "1025" } },
        ],
        responses: {
          200: { description: "Ticket found — returns array[1]" },
          404: { description: "Ticket not found" },
        },
      },
    },

    // ── Categories ───────────────────────────────────────────────
    "/b2bSC_getCatagories/v2": {
      post: { tags: ["Ticket Types"], summary: "Get ticket type / service / category / subCategory tree",
        description: "POST with empty body. Returns full selection tree for raise-ticket form.",
        requestBody: { content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Category tree" } },
      },
    },

    // ── Raise Ticket ─────────────────────────────────────────────
    "/b2bSC_raiseTicket/v1": {
      post: { tags: ["Raise Ticket"], summary: "Create a new ticket",
        description: [
          "All fields required except `supportDocsList`.",
          "Use `msisdn` (phone number) instead of `contractId` — the server resolves the customer automatically.",
          "On success, `ticketNo` is added to `customer.ticket_ids[]`.",
        ].join(" "),
        requestBody: { required: true, content: { "application/json": {
          schema: { type: "object",
            required: ["msisdn","ticketType","service","category","subCat","title","summary","subCatName","callBackNumber"],
            properties: {
              msisdn:         { type: "string",  example: "01711234567",     description: "Customer phone number" },
              ticketType:     { type: "string",  example: "Complaint" },
              service:        { type: "string",  example: "Fixed" },
              category:       { type: "string",  example: "Network Issue" },
              subCat:         { type: "string",  example: "TC0110211613",    description: "subCategory.id from /b2bSC_getCatagories/v2" },
              title:          { type: "string",  example: "Chatbot Ticket (TEST)" },
              summary:        { type: "string",  example: "No signal at Mirpur-10" },
              subCatName:     { type: "string",  example: "Reachability" },
              callBackNumber: { type: "string",  example: "01711234567" },
              supportDocsList:{ type: "array",   items: { type: "string" }, default: [] },
            },
          },
        }}},
        responses: {
          201: { description: "Ticket created — returns ticketNumber" },
          400: { description: "Missing required fields" },
          404: { description: "msisdn not found" },
        },
      },
    },

    // ── Ticket CRUD ──────────────────────────────────────────────
    "/tickets": {
      get: { tags: ["Tickets CRUD"], summary: "List all tickets for a phone number",
        parameters: [{ name: "msisdn", in: "query", required: true, schema: { type: "string", example: "01711234567" } }],
        responses: { 200: { description: "Ticket list" } } },
    },
    "/tickets/{ticketNo}": {
      get: { tags: ["Tickets CRUD"], summary: "Get one ticket",
        parameters: [
          { name: "ticketNo", in: "path",  required: true, schema: { type: "string", example: "TT105368" } },
          { name: "msisdn",   in: "query", required: true, schema: { type: "string", example: "01711234567" } },
        ],
        responses: { 200: { description: "Ticket" }, 403: { description: "Wrong owner" }, 404: { description: "Not found" } } },
      patch: { tags: ["Tickets CRUD"], summary: "Update ticket status / priority / note",
        parameters: [{ name: "ticketNo", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object",
          required: ["msisdn"],
          properties: {
            msisdn:   { type: "string", example: "01711234567" },
            status:   { type: "string", enum: ["Open","InProgress","Closed","Cancelled"] },
            priority: { type: "string", enum: ["Low","Medium","High","Critical"] },
            note:     { type: "string", example: "Agent followed up with customer" },
          },
        }}}},
        responses: { 200: { description: "Updated" }, 403: { description: "Wrong owner" } } },
      delete: { tags: ["Tickets CRUD"], summary: "Delete ticket (unlinks from customer)",
        parameters: [{ name: "ticketNo", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object",
          required: ["msisdn"],
          properties: { msisdn: { type: "string", example: "01711234567" } },
        }}}},
        responses: { 200: { description: "Deleted" }, 403: { description: "Wrong owner" } } },
    },
  },
};

if (swaggerUi) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
}
app.get("/swagger.json", (req, res) => res.json(spec));

// ── Global error handler ──────────────────────────────────────
// Must be last, must have 4 args
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error:  "Invalid JSON in request body",
      hint:   "Check for trailing commas or unquoted keys",
      detail: err.message,
    });
  }
  console.error("Unhandled:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
✅  Ticket Mock API  →  http://localhost:${PORT}
    /health                  – no auth
    /api-docs                – Swagger UI
    /swagger.json            – OpenAPI spec

📋  Spec endpoints:
    GET  /DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=
    POST /b2bSC_getCatagories/v2
    POST /b2bSC_raiseTicket/v1

👥  Seeded customers (lookup by msisdn):
    01711234567  Rahim Uddin    → TT105368
    01812345678  Fatema Begum   → (no tickets)
    01911223344  Karim Hassan   → TT193426, TT536791
    01755667788  Nadia Islam    → (no tickets)
`);
});
