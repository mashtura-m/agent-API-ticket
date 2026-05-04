const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 8000;

/* ─────────────────────────────────────────────
   Middleware
───────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const DB_DIR = path.join(__dirname, "db");
const DB_FILE = path.join(DB_DIR, "database.json");

const VALID_STATUS = ["Open", "InProgress", "Resolved", "Closed", "Cancelled"];
const VALID_PRIORITY = ["Low", "Medium", "High", "Critical"];

/* ─────────────────────────────────────────────
   Init DB
───────────────────────────────────────────── */
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ customers: [], tickets: [], categories: { type: [] } }, null, 2));
}

/* ─────────────────────────────────────────────
   DB Helpers
───────────────────────────────────────────── */
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

/* ─────────────────────────────────────────────
   Utils
───────────────────────────────────────────── */
const now = () => new Date().toISOString();
const genCustId = () => `cust-${crypto.randomUUID().slice(0, 6)}`;
const genTicket = () => `TT${Math.floor(100000 + Math.random() * 900000)}`;

const isMSISDN = (m) => /^[0-9]{11,15}$/.test(m);
const isTicket = (t) => /^TT\d{6}$/.test(t);

/* ─────────────────────────────────────────────
   Middleware Validators
───────────────────────────────────────────── */
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const validateMSISDN = (req, res, next) => {
  if (!isMSISDN(req.params.msisdn)) {
    return res.status(400).json({ error: "Invalid MSISDN" });
  }
  next();
};

const validateTicket = (req, res, next) => {
  if (!isTicket(req.params.ticketNo)) {
    return res.status(400).json({ error: "Invalid TicketNo" });
  }
  next();
};

/* ─────────────────────────────────────────────
   Health
───────────────────────────────────────────── */
app.get("/health", (req, res) => {
  const db = readDB();
  res.json({
    status: "ok",
    customers: db.customers.length,
    tickets: db.tickets.length,
    time: now(),
  });
});

/* ─────────────────────────────────────────────
   Customers
───────────────────────────────────────────── */

// Create
app.post("/customers", auth, (req, res) => {
  const { customer_name, msisdn } = req.body;

  if (!customer_name || !isMSISDN(msisdn)) {
    return res.status(400).json({ error: "Valid customer_name & msisdn required" });
  }

  const db = readDB();

  if (db.customers.find(c => c.msisdn === msisdn)) {
    return res.status(409).json({ error: "MSISDN exists" });
  }

  const customer = {
    id: genCustId(),
    customer_name,
    msisdn,
    package_name: "Basic",
    package_type: "prepaid",
    data_quota_mb: 1024,
    validity_days: 30,
    current_balance: 0,
    ticket_ids: [],
    createdAt: now()
  };

  db.customers.push(customer);
  writeDB(db);

  res.status(201).json({ message: "Customer created", customer });
});

// Get Customer
app.get("/customers/:msisdn", auth, validateMSISDN, (req, res) => {
  const db = readDB();
  const customer = db.customers.find(c => c.msisdn === req.params.msisdn);

  if (!customer) return res.status(404).json({ error: "Not found" });

  res.json(customer);
});

// Update
app.patch("/customers/:msisdn", auth, validateMSISDN, (req, res) => {
  const db = readDB();
  const customer = db.customers.find(c => c.msisdn === req.params.msisdn);

  if (!customer) return res.status(404).json({ error: "Not found" });

  Object.assign(customer, req.body);
  writeDB(db);

  res.json({ message: "Updated", customer });
});

// Delete
app.delete("/customers/:msisdn", auth, validateMSISDN, (req, res) => {
  const db = readDB();

  db.customers = db.customers.filter(c => c.msisdn !== req.params.msisdn);
  db.tickets = db.tickets.filter(t => t.msisdn !== req.params.msisdn);

  writeDB(db);

  res.json({ message: "Customer & tickets deleted" });
});

/* ─────────────────────────────────────────────
   Customer Tickets
───────────────────────────────────────────── */
app.get("/customers/:msisdn/tickets", auth, validateMSISDN, (req, res) => {
  const db = readDB();

  const tickets = db.tickets.filter(t => t.msisdn === req.params.msisdn);

  res.json({ total: tickets.length, tickets });
});

/* ─────────────────────────────────────────────
   Tickets
───────────────────────────────────────────── */

// Create Ticket
app.post("/b2bSC_raiseTicket/v1", auth, (req, res) => {
  const { msisdn, summary } = req.body;

  if (!isMSISDN(msisdn) || !summary) {
    return res.status(400).json({
      statusCode: "1",
      statusMessage: "Valid msisdn & summary required"
    });
  }

  const db = readDB();
  const customer = db.customers.find(c => c.msisdn === msisdn);

  if (!customer) {
    return res.status(404).json({
      statusCode: "1",
      statusMessage: "Customer not found"
    });
  }

  const ticket = {
    ticketNo: genTicket(),
    summary,
    status: "Open",
    priority: "Medium",
    msisdn,
    contractId: customer.id,
    notes: [],
    createdDate: now(),
    modifiedDate: now()
  };

  db.tickets.push(ticket);
  customer.ticket_ids.push(ticket.ticketNo);

  writeDB(db);

  res.status(201).json({
    statusCode: "0",
    ticketNumber: ticket.ticketNo,
    ticket
  });
});

// Get Ticket
app.get("/tickets/:ticketNo", auth, validateTicket, (req, res) => {
  const db = readDB();
  const ticket = db.tickets.find(t => t.ticketNo === req.params.ticketNo);

  if (!ticket) return res.status(404).json({ error: "Not found" });

  res.json(ticket);
});

// Update Ticket
app.patch("/tickets/:ticketNo", auth, validateTicket, (req, res) => {
  const db = readDB();
  const ticket = db.tickets.find(t => t.ticketNo === req.params.ticketNo);

  if (!ticket) return res.status(404).json({ error: "Not found" });

  if (req.body.status && !VALID_STATUS.includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  if (req.body.priority && !VALID_PRIORITY.includes(req.body.priority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }

  if (req.body.note) {
    ticket.notes.push({ text: req.body.note, date: now() });
  }

  Object.assign(ticket, req.body);
  ticket.modifiedDate = now();

  writeDB(db);

  res.json({ message: "Updated", ticket });
});

// Delete Ticket
app.delete("/tickets/:ticketNo", auth, validateTicket, (req, res) => {
  const db = readDB();

  const ticket = db.tickets.find(t => t.ticketNo === req.params.ticketNo);
  if (!ticket) return res.status(404).json({ error: "Not found" });

  db.tickets = db.tickets.filter(t => t.ticketNo !== ticket.ticketNo);

  const cust = db.customers.find(c => c.msisdn === ticket.msisdn);
  if (cust) {
    cust.ticket_ids = cust.ticket_ids.filter(id => id !== ticket.ticketNo);
  }

  writeDB(db);

  res.json({ message: "Deleted" });
});

/* ─────────────────────────────────────────────
   SOA Endpoint
───────────────────────────────────────────── */
app.get(
  "/DigitalService/TroubleTicketRestService/troubleTicket/:ticketNo",
  auth,
  validateTicket,
  (req, res) => {
    const db = readDB();
    const t = db.tickets.find(x => x.ticketNo === req.params.ticketNo);

    if (!t) return res.status(404).json({ error: "Not found" });

    res.json([{
      ticketNo: t.ticketNo,
      status: t.status,
      priority: t.priority,
      description: t.summary,
      createdDate: t.createdDate,
      accountId: [t.contractId],
      publicIdentifier: [t.msisdn],
      note: t.notes
    }]);
  }
);

/* ─────────────────────────────────────────────
   Errors
───────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ─────────────────────────────────────────────
   Server
───────────────────────────────────────────── */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});