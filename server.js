/**
 * Ticket Mock API — Single File Server
 * ─────────────────────────────────────
 * No subfolders needed. Drop this file + package.json in any directory,
 * run: npm install && node server.js
 *
 * DB: JSON files written next to server.js (auto-created on first run)
 * Port: 8000 (override with PORT env var)
 */

const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

let swaggerUi;
try { swaggerUi = require("swagger-ui-express"); } catch (_) {}

const app  = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════
// JSON FILE DB
// Two writable files: customers.json, tickets.json
// One read-only:      categories.json
// Auto-seeded on first run if files don't exist.
// ═══════════════════════════════════════════════════════════════

const DB_DIR = path.join(__dirname, "db");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const PATHS = {
  customers:  path.join(DB_DIR, "customers.json"),
  tickets:    path.join(DB_DIR, "tickets.json"),
  categories: path.join(DB_DIR, "categories.json"),
};

// ── Seed data ────────────────────────────────────────────────
const SEED_CUSTOMERS = [
  { id: "cust-001",      customer_name: "Rahim Uddin",   msisdn: "01711234567", package_name: "Go 12",           package_type: "prepaid",  data_quota_mb: 30720, validity_days: 30, current_balance: 350, last_flexiload_date: "2026-04-20T10:30:00Z", last_trxid: "TRX20260501NEWXYZ",    ticket_ids: ["TT105368"] },
  { id: "cust-002",      customer_name: "Fatema Begum",  msisdn: "01812345678", package_name: "Talk More 7",     package_type: "prepaid",  data_quota_mb: 2048,  validity_days: 7,  current_balance: 55,  last_flexiload_date: "2026-04-28T14:00:00Z", last_trxid: "TRX20260428140012B",   ticket_ids: [] },
  { id: "cust-003",      customer_name: "Karim Hassan",  msisdn: "01911223344", package_name: "Postpaid Pro 500",package_type: "postpaid", data_quota_mb: 51200, validity_days: 30, current_balance: 0,   last_flexiload_date: null,                   last_trxid: "TRX20260401090000C",   ticket_ids: ["TT193426","TT536791"] },
  { id: "cust-7727a0ce", customer_name: "Nadia Islam",   msisdn: "01755667788", package_name: "Super Data 30",  package_type: "prepaid",  data_quota_mb: 30720, validity_days: 30, current_balance: 200, last_flexiload_date: null,                   last_trxid: null,                   ticket_ids: [] },
];

const SEED_TICKETS = [
  { ticketNo: "TT105368", ticketType: "Complaint", service: "Fixed",    category: "Network Issue", subCat: "TC0110211613", subCatName: "Reachability", title: "Chatbot Ticket (test)", summary: "No data service in Mirpur-10 area since 9am",  priority: "High",   status: "Open",       msisdn: "01711234567", contractId: "cust-001", callBackNumber: "01711234567", description: "title=Chatbot Ticket (test)| type=Complaint| service=Fixed| category=Network Issue| subCategoryName=Reachability| summary=No data service in Mirpur-10 area since 9am",  note: [{ date: "2026-05-01T11:18:51.768Z", author: "agent",             text: "Customer reported network issue at Mirpur-10" }], attachment: [], createdDate: "2026-05-01T11:00:00.000Z", modifiedDate: "2026-05-01T11:18:51.768Z" },
  { ticketNo: "TT193426", ticketType: "Complaint", service: "Fixed",    category: "Network Issue", subCat: "TC0110211613", subCatName: "Reachability", title: "Chatbot Ticket (test)", summary: "testing ticket",                                   priority: "Medium", status: "Closed",     msisdn: "01911223344", contractId: "cust-003", callBackNumber: "01911223344", description: "title=Chatbot Ticket (test)| type=Complaint| service=Fixed| category=Network Issue| subCategoryName=Reachability| summary=testing ticket",                                  note: [{ date: "2024-12-12T06:49:30.669Z", author: "Mohammed.AlZoubi", text: "TEST \n" }],                                      attachment: [], createdDate: "2024-12-11T14:26:45.222Z", modifiedDate: "2024-12-12T06:49:47.347Z" },
  { ticketNo: "TT536791", ticketType: "Complaint", service: "Mobility", category: "Billing",       subCat: "TC0220311001", subCatName: "Overcharge",   title: "Billing Dispute",       summary: "Overcharged on last bill cycle",                  priority: "Low",    status: "InProgress", msisdn: "01911223344", contractId: "cust-003", callBackNumber: "01911223344", description: "title=Billing Dispute| type=Complaint| service=Mobility| category=Billing| subCategoryName=Overcharge| summary=Overcharged on last bill cycle",                          note: [],                                                                                                                      attachment: [], createdDate: "2026-04-15T08:22:00.000Z", modifiedDate: "2026-04-16T09:00:00.000Z" },
];

const SEED_CATEGORIES = {
  type: [
    { label: "Complaint", service: [
        { label: "Fixed",    name: "Fixed",    category: [
            { label: "Network Issue",  id: "", subCategory: [{ id: "TC0110211613", label: "Reachability",     msidn: "Y" }, { id: "TC0110211614", label: "Slow Speed",        msidn: "Y" }, { id: "TC0110211615", label: "Intermittent Drop", msidn: "Y" }] },
            { label: "Service Outage", id: "", subCategory: [{ id: "TC0110311701", label: "Complete Outage",  msidn: "Y" }, { id: "TC0110311702", label: "Partial Outage",    msidn: "Y" }] },
        ]},
        { label: "Mobility", name: "Mobility", category: [
            { label: "Billing",        id: "", subCategory: [{ id: "TC0220311001", label: "Overcharge",       msidn: "Y" }, { id: "TC0220311002", label: "Wrong Deduction",   msidn: "Y" }, { id: "TC0220311003", label: "Refund Request",    msidn: "Y" }] },
            { label: "Network Issue",  id: "", subCategory: [{ id: "TC0220411613", label: "No Signal",        msidn: "Y" }, { id: "TC0220411614", label: "Call Drop",         msidn: "Y" }] },
        ]},
    ]},
    { label: "Requests", service: [
        { label: "Fixed",    name: "Fixed",    category: [
            { label: "New Connection", id: "", subCategory: [{ id: "TC0330511801", label: "Home Broadband",   msidn: "N" }, { id: "TC0330511802", label: "Corporate Leased",  msidn: "N" }] },
        ]},
        { label: "Mobility", name: "Mobility", category: [
            { label: "SIM Replacement",id: "", subCategory: [{ id: "TC0330611901", label: "Lost SIM",         msidn: "Y" }, { id: "TC0330611902", label: "Damaged SIM",       msidn: "Y" }] },
        ]},
    ]},
  ],
};

// ── Bootstrap: write all DB files on startup ─────────────────
// All three files are written immediately so they exist before
// any request arrives. Existing files are never overwritten.
function initDb() {
  if (!fs.existsSync(PATHS.customers))
    fs.writeFileSync(PATHS.customers,  JSON.stringify({ customers:  SEED_CUSTOMERS }, null, 2));
  if (!fs.existsSync(PATHS.tickets))
    fs.writeFileSync(PATHS.tickets,    JSON.stringify({ tickets:    SEED_TICKETS   }, null, 2));
  if (!fs.existsSync(PATHS.categories))
    fs.writeFileSync(PATHS.categories, JSON.stringify(SEED_CATEGORIES,               null, 2));
  console.log("💾  DB files ready in", DB_DIR);
}
initDb();

// ── Read / write helpers ─────────────────────────────────────
function readDb(key) {
  return JSON.parse(fs.readFileSync(PATHS[key], "utf8"))[key];
}

function readCategories() {
  return JSON.parse(fs.readFileSync(PATHS.categories, "utf8"));
}

function writeDb(key, data) {
  fs.writeFileSync(PATHS[key], JSON.stringify({ [key]: data }, null, 2));
}

// ── DB API ────────────────────────────────────────────────────
const db = {
  customers() { return readDb("customers"); },
  tickets()   { return readDb("tickets");   },
  categories(){ return readCategories();    },

  findCustomer(idOrMsisdn) {
    return this.customers().find(c => c.id === idOrMsisdn || c.msisdn === idOrMsisdn);
  },
  saveCustomer(customer) {
    const list = this.customers();
    const i = list.findIndex(c => c.id === customer.id);
    if (i === -1) list.push(customer); else list[i] = customer;
    writeDb("customers", list);
    return customer;
  },
  deleteCustomer(id) {
    const list = this.customers().filter(c => c.id !== id);
    writeDb("customers", list);
  },

  findTicket(ticketNo) {
    return this.tickets().find(t => t.ticketNo === ticketNo);
  },
  saveTicket(ticket) {
    const list = this.tickets();
    const i = list.findIndex(t => t.ticketNo === ticket.ticketNo);
    if (i === -1) list.push(ticket); else list[i] = ticket;
    writeDb("tickets", list);
    return ticket;
  },
  deleteTicket(ticketNo) {
    writeDb("tickets", this.tickets().filter(t => t.ticketNo !== ticketNo));
  },

  newTicketNo() { return `TT${Math.floor(100000 + Math.random() * 900000)}`; },
};


// ═══════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// Any non-empty Authorization or authCode header passes.
// ═══════════════════════════════════════════════════════════════
function auth(req, res, next) {
  const token = req.headers["authorization"] || req.headers["authcode"] || "";
  if (!token.trim()) {
    return res.status(401).json({
      error: "Unauthorized",
      hint:  "Add header: Authorization: Bearer demo-token",
    });
  }
  next();
}

// ═══════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════
app.get("/health", (req, res) => {
  res.json({ status: "ok", customers: db.customers().length, tickets: db.tickets().length });
});

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS
// Lookup by customer id or msisdn (phone number)
// ═══════════════════════════════════════════════════════════════

app.get("/customers", auth, (req, res) => {
  const list = db.customers();
  res.json({ total: list.length, customers: list });
});

app.get("/customers/:id", auth, (req, res) => {
  const c = db.findCustomer(req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  res.json(c);
});

app.post("/customers", auth, (req, res) => {
  const { customer_name, msisdn, package_name, package_type, data_quota_mb, validity_days, current_balance } = req.body;
  if (!customer_name || !msisdn)
    return res.status(400).json({ error: "customer_name and msisdn are required" });
  if (db.findCustomer(msisdn))
    return res.status(409).json({ error: `msisdn ${msisdn} already exists` });

  const c = {
    id: `cust-${Date.now().toString(36)}`,
    customer_name, msisdn,
    package_name:    package_name    || "",
    package_type:    package_type    || "prepaid",
    data_quota_mb:   data_quota_mb   || 0,
    validity_days:   validity_days   || 30,
    current_balance: current_balance || 0,
    last_flexiload_date: null,
    last_trxid: null,
    ticket_ids: [],
  };
  db.saveCustomer(c);
  res.status(201).json(c);
});

app.patch("/customers/:id", auth, (req, res) => {
  const c = db.findCustomer(req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  ["current_balance","package_name","package_type","data_quota_mb","validity_days","last_flexiload_date","last_trxid"]
    .forEach(f => { if (req.body[f] !== undefined) c[f] = req.body[f]; });
  db.saveCustomer(c);
  res.json(c);
});

app.delete("/customers/:id", auth, (req, res) => {
  const c = db.findCustomer(req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  db.deleteCustomer(c.id);
  res.json({ message: `Customer ${c.id} (${c.msisdn}) deleted` });
});

// ═══════════════════════════════════════════════════════════════
// SOA — GET TICKET STATUS
// Spec: GET /DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=
// Lookup: ticketNo only. Returns exact SOA response shape.
// ═══════════════════════════════════════════════════════════════
app.get("/DigitalService/TroubleTicketRestService/troubleTicket", auth, (req, res) => {
  const { ticketNo } = req.query;
  if (!ticketNo) return res.status(400).json({ error: "ticketNo query param is required" });

  const t = db.findTicket(ticketNo);
  if (!t) return res.status(404).json({ error: `Ticket ${ticketNo} not found` });

  res.json([{
    ticketNo:         t.ticketNo,
    ticketType:       t.ticketType,
    priority:         t.priority,
    status:           t.status,
    description:      t.description,
    createdDate:      t.createdDate,
    modifiedDate:     t.modifiedDate,
    customerId:       [],
    accountId:        [t.contractId],
    productId:        [],
    publicIdentifier: [t.msisdn],
    category:         [{ id: t.subCat, name: `${t.subCatName}-SMC`, ticketType: t.ticketType }],
    note:             t.note,
    attachment:       t.attachment,
    customFields:     {},
  }]);
});

// ═══════════════════════════════════════════════════════════════
// GET TICKET TYPES
// Spec: POST /b2bSC_getCatagories/v2  (spelling from spec preserved)
// Returns type → service → category → subCategory tree.
// ═══════════════════════════════════════════════════════════════
app.post("/b2bSC_getCatagories/v2", auth, (req, res) => {
  res.json(JSON.parse(fs.readFileSync(PATHS.categories, "utf8")));
});
app.get("/b2bSC_getCatagories/v2", auth, (req, res) => {
  res.json(JSON.parse(fs.readFileSync(PATHS.categories, "utf8")));
});

// ═══════════════════════════════════════════════════════════════
// RAISE TICKET
// Spec: POST /b2bSC_raiseTicket/v1
// Required: msisdn, ticketType, service, category, subCat,
//           title, summary, subCatName, callBackNumber
// msisdn resolves contractId internally.
// ticketNo auto-generated and linked to customer.ticket_ids[].
// ═══════════════════════════════════════════════════════════════
app.post("/b2bSC_raiseTicket/v1", auth, (req, res) => {
  const { msisdn, ticketType, service, category, subCat, title, summary, subCatName, callBackNumber, supportDocsList } = req.body;

  const missing = ["msisdn","ticketType","service","category","subCat","title","summary","subCatName","callBackNumber"]
    .filter(f => !req.body[f]);
  if (missing.length)
    return res.status(400).json({ statusCode: "1", stausMessage: `Missing required fields: ${missing.join(", ")}` });

  const customer = db.findCustomer(msisdn);
  if (!customer)
    return res.status(404).json({ statusCode: "1", stausMessage: `No customer found for msisdn ${msisdn}` });

  const ticketNo = db.newTicketNo();
  const now      = new Date().toISOString();

  db.saveTicket({
    ticketNo, ticketType, service, category, subCat, subCatName, title, summary,
    priority:      "High",
    status:        "Open",
    msisdn:        customer.msisdn,
    contractId:    customer.id,
    callBackNumber,
    description:   `title=${title}| type=${ticketType}| service=${service}| category=${category}| subCategoryName=${subCatName}| summary=${summary}`,
    note:          [],
    attachment:    supportDocsList || [],
    createdDate:   now,
    modifiedDate:  now,
  });

  customer.ticket_ids.push(ticketNo);
  db.saveCustomer(customer);

  res.status(201).json({ statusCode: "0", stausMessage: "success", ticketNumber: ticketNo });
});

// ═══════════════════════════════════════════════════════════════
// TICKET CRUD
// Ownership verified by msisdn on every operation.
// ═══════════════════════════════════════════════════════════════

// GET /tickets?msisdn=01711234567
app.get("/tickets", auth, (req, res) => {
  const { msisdn } = req.query;
  if (!msisdn) return res.status(400).json({ error: "msisdn query param is required" });
  if (!db.findCustomer(msisdn)) return res.status(404).json({ error: `No customer for msisdn ${msisdn}` });
  const result = db.tickets().filter(t => t.msisdn === msisdn);
  res.json({ msisdn, total: result.length, tickets: result });
});

// GET /tickets/:ticketNo?msisdn=01711234567
app.get("/tickets/:ticketNo", auth, (req, res) => {
  const { msisdn } = req.query;
  if (!msisdn) return res.status(400).json({ error: "msisdn query param is required" });
  const t = db.findTicket(req.params.ticketNo);
  if (!t)                  return res.status(404).json({ error: "Ticket not found" });
  if (t.msisdn !== msisdn) return res.status(403).json({ error: "Ticket does not belong to this msisdn" });
  res.json(t);
});

// PATCH /tickets/:ticketNo  body: { msisdn, status?, priority?, note? }
app.patch("/tickets/:ticketNo", auth, (req, res) => {
  const { msisdn, status, priority, note } = req.body;
  if (!msisdn) return res.status(400).json({ error: "msisdn is required in body" });
  const t = db.findTicket(req.params.ticketNo);
  if (!t)                  return res.status(404).json({ error: "Ticket not found" });
  if (t.msisdn !== msisdn) return res.status(403).json({ error: "Ticket does not belong to this msisdn" });
  if (status)   t.status   = status;
  if (priority) t.priority = priority;
  if (note)     t.note.push({ date: new Date().toISOString(), author: "api-agent", text: note });
  t.modifiedDate = new Date().toISOString();
  db.saveTicket(t);
  res.json({ message: "Ticket updated", ticket: t });
});

// DELETE /tickets/:ticketNo  body: { msisdn }
app.delete("/tickets/:ticketNo", auth, (req, res) => {
  const { msisdn } = req.body;
  if (!msisdn) return res.status(400).json({ error: "msisdn is required in body" });
  const t = db.findTicket(req.params.ticketNo);
  if (!t)                  return res.status(404).json({ error: "Ticket not found" });
  if (t.msisdn !== msisdn) return res.status(403).json({ error: "Ticket does not belong to this msisdn" });
  db.deleteTicket(req.params.ticketNo);
  const customer = db.findCustomer(msisdn);
  if (customer) {
    customer.ticket_ids = customer.ticket_ids.filter(id => id !== req.params.ticketNo);
    db.saveCustomer(customer);
  }
  res.json({ message: `Ticket ${req.params.ticketNo} deleted` });
});

// ═══════════════════════════════════════════════════════════════
// SWAGGER
// ═══════════════════════════════════════════════════════════════
const spec = {
  openapi: "3.0.0",
  info: {
    title: "Ticket Mock API",
    version: "3.0.0",
    description: [
      "Mock of three real endpoints + CRUD helpers.",
      "",
      "**Auth**: any non-empty `Authorization: Bearer <anything>` passes.",
      "",
      "**Keys**: `msisdn` (phone) identifies customers. `ticketNo` identifies tickets.",
      "",
      "| msisdn | Customer | Tickets |",
      "|---|---|---|",
      "| 01711234567 | Rahim Uddin  | TT105368 (Open) |",
      "| 01812345678 | Fatema Begum | — |",
      "| 01911223344 | Karim Hassan | TT193426 (Closed), TT536791 (InProgress) |",
      "| 01755667788 | Nadia Islam  | — |",
    ].join("\n"),
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  components: { securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } } },
  security: [{ BearerAuth: [] }],
  paths: {
    "/health": { get: { tags: ["Util"], summary: "Health check (no auth)", responses: { 200: { description: "OK" } } } },
    "/customers": {
      get:  { tags: ["Customers"], summary: "List all customers", responses: { 200: { description: "List" } } },
      post: { tags: ["Customers"], summary: "Create customer",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["customer_name","msisdn"],
          properties: { customer_name: { type: "string", example: "Ahmed Ali" }, msisdn: { type: "string", example: "01911000001" } } } } } },
        responses: { 201: { description: "Created" }, 409: { description: "msisdn exists" } } },
    },
    "/customers/{id}": {
      get:    { tags: ["Customers"], summary: "Get by id or msisdn", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "01711234567" } }], responses: { 200: { description: "Customer" } } },
      patch:  { tags: ["Customers"], summary: "Update customer", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { current_balance: { type: "number" }, package_name: { type: "string" } } } } } },
        responses: { 200: { description: "Updated" } } },
      delete: { tags: ["Customers"], summary: "Delete customer", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } },
    },
    "/DigitalService/TroubleTicketRestService/troubleTicket": {
      get: { tags: ["SOA — Ticket Status"], summary: "Get ticket by ticketNo",
        parameters: [
          { name: "ticketNo",            in: "query",  required: true,  schema: { type: "string", example: "TT105368" } },
          { name: "Version",             in: "header", required: false, schema: { type: "string", default: "1" } },
          { name: "SequenceId",          in: "header", required: false, schema: { type: "string", default: "1" } },
          { name: "TransactionId",       in: "header", required: false, schema: { type: "string", default: "1" } },
          { name: "SenderHostName",      in: "header", required: false, schema: { type: "string", default: "127.0.0.1" } },
          { name: "SerialNo",            in: "header", required: false, schema: { type: "string", default: "21212122" } },
          { name: "CreationTimeStamp",   in: "header", required: false, schema: { type: "string", default: "20200518104100" } },
          { name: "DeliveryChannelType", in: "header", required: false, schema: { type: "string", default: "B2BBOT" } },
          { name: "RequestType",         in: "header", required: false, schema: { type: "string", default: "Event" } },
          { name: "BusinessProcessId",   in: "header", required: false, schema: { type: "string", default: "getIndividualCustomerProfile" } },
          { name: "OperatorId",          in: "header", required: false, schema: { type: "string", default: "1025" } },
        ],
        responses: { 200: { description: "Ticket array[1]" }, 404: { description: "Not found" } } },
    },
    "/b2bSC_getCatagories/v2": {
      post: { tags: ["Ticket Types"], summary: "Get type/service/category/subCategory tree", requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: { 200: { description: "Category tree" } } },
    },
    "/b2bSC_raiseTicket/v1": {
      post: { tags: ["Raise Ticket"], summary: "Create ticket (auto-links to customer)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object",
          required: ["msisdn","ticketType","service","category","subCat","title","summary","subCatName","callBackNumber"],
          properties: {
            msisdn:         { type: "string", example: "01711234567" },
            ticketType:     { type: "string", example: "Complaint" },
            service:        { type: "string", example: "Fixed" },
            category:       { type: "string", example: "Network Issue" },
            subCat:         { type: "string", example: "TC0110211613" },
            title:          { type: "string", example: "Chatbot Ticket (TEST)" },
            summary:        { type: "string", example: "No signal at Mirpur-10" },
            subCatName:     { type: "string", example: "Reachability" },
            callBackNumber: { type: "string", example: "01711234567" },
            supportDocsList:{ type: "array",  items: { type: "string" }, default: [] },
          } } } } },
        responses: { 201: { description: "{ statusCode, stausMessage, ticketNumber }" }, 400: { description: "Missing fields" }, 404: { description: "msisdn not found" } } },
    },
    "/tickets": {
      get: { tags: ["Tickets CRUD"], summary: "List tickets by msisdn",
        parameters: [{ name: "msisdn", in: "query", required: true, schema: { type: "string", example: "01711234567" } }],
        responses: { 200: { description: "Ticket list" } } },
    },
    "/tickets/{ticketNo}": {
      get: { tags: ["Tickets CRUD"], summary: "Get one ticket",
        parameters: [{ name: "ticketNo", in: "path", required: true, schema: { type: "string" } }, { name: "msisdn", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Ticket" }, 403: { description: "Wrong owner" } } },
      patch: { tags: ["Tickets CRUD"], summary: "Update status / priority / note",
        parameters: [{ name: "ticketNo", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["msisdn"],
          properties: { msisdn: { type: "string", example: "01711234567" }, status: { type: "string", enum: ["Open","InProgress","Closed","Cancelled"] }, priority: { type: "string", enum: ["Low","Medium","High","Critical"] }, note: { type: "string" } } } } } },
        responses: { 200: { description: "Updated" } } },
      delete: { tags: ["Tickets CRUD"], summary: "Delete ticket",
        parameters: [{ name: "ticketNo", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["msisdn"], properties: { msisdn: { type: "string", example: "01711234567" } } } } } },
        responses: { 200: { description: "Deleted" } } },
    },
  },
};

if (swaggerUi) app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
app.get("/swagger.json", (req, res) => res.json(spec));

// Global JSON parse error handler (must be last, must have 4 args)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON in request body", hint: "Check for trailing commas or unquoted keys" });
  console.error("Unhandled:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
✅  Ticket Mock API  →  http://localhost:${PORT}
    /health        – no auth needed
    /api-docs      – Swagger UI
    /swagger.json  – OpenAPI spec

📋  Spec endpoints:
    GET  /DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=
    POST /b2bSC_getCatagories/v2
    POST /b2bSC_raiseTicket/v1

👥  Seeded customers (use msisdn to look up):
    01711234567  Rahim Uddin    → TT105368 (Open)
    01812345678  Fatema Begum   → (no tickets)
    01911223344  Karim Hassan   → TT193426 (Closed), TT536791 (InProgress)
    01755667788  Nadia Islam    → (no tickets)

💾  DB files auto-created in ./db/ on first run
`);
});