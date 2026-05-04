/**
 * routes/tickets.js
 * CRUD operations on existing tickets.
 *
 * Lookup key: ticketNo (path) + msisdn (query/body) for ownership check.
 * msisdn replaces contractId as the human-friendly identifier.
 */

const router = require("express").Router();
const db     = require("../db");

// ── Ownership guard ───────────────────────────────────────────
function owns(ticket, msisdn) {
  return ticket.msisdn === msisdn;
}

// GET /tickets?msisdn=01711234567
// Returns all tickets for a phone number
router.get("/", (req, res) => {
  const { msisdn } = req.query;
  if (!msisdn) return res.status(400).json({ error: "msisdn query param is required" });

  const customer = db.findCustomer(msisdn);
  if (!customer)  return res.status(404).json({ error: `No customer found for msisdn ${msisdn}` });

  const result = db.getTickets().filter((t) => t.msisdn === msisdn);
  res.json({ msisdn, total: result.length, tickets: result });
});

// GET /tickets/:ticketNo?msisdn=01711234567
router.get("/:ticketNo", (req, res) => {
  const { msisdn } = req.query;
  if (!msisdn) return res.status(400).json({ error: "msisdn query param is required" });

  const t = db.findTicket(req.params.ticketNo);
  if (!t)            return res.status(404).json({ error: "Ticket not found" });
  if (!owns(t, msisdn)) return res.status(403).json({ error: "Ticket does not belong to this msisdn" });

  res.json(t);
});

// PATCH /tickets/:ticketNo
// Required body: msisdn + at least one of: status, priority, note
router.patch("/:ticketNo", (req, res) => {
  const { msisdn, status, priority, note } = req.body;
  if (!msisdn) return res.status(400).json({ error: "msisdn is required in body" });

  const t = db.findTicket(req.params.ticketNo);
  if (!t)            return res.status(404).json({ error: "Ticket not found" });
  if (!owns(t, msisdn)) return res.status(403).json({ error: "Ticket does not belong to this msisdn" });

  if (status)   t.status   = status;
  if (priority) t.priority = priority;
  if (note)     t.note.push({ date: new Date().toISOString(), author: "api-agent", text: note });
  t.modifiedDate = new Date().toISOString();

  db.saveTicket(t);
  res.json({ message: "Ticket updated", ticket: t });
});

// DELETE /tickets/:ticketNo
// Required body: msisdn
router.delete("/:ticketNo", (req, res) => {
  const { msisdn } = req.body;
  if (!msisdn) return res.status(400).json({ error: "msisdn is required in body" });

  const t = db.findTicket(req.params.ticketNo);
  if (!t)            return res.status(404).json({ error: "Ticket not found" });
  if (!owns(t, msisdn)) return res.status(403).json({ error: "Ticket does not belong to this msisdn" });

  db.deleteTicket(req.params.ticketNo);

  // Unlink from customer
  const customer = db.findCustomer(msisdn);
  if (customer) {
    customer.ticket_ids = customer.ticket_ids.filter((id) => id !== req.params.ticketNo);
    db.saveCustomer(customer);
  }

  res.json({ message: `Ticket ${req.params.ticketNo} deleted` });
});

module.exports = router;
