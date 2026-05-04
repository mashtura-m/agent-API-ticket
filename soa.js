/**
 * routes/soa.js
 * GET /DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT105368
 *
 * Mirrors the real SOA endpoint exactly.
 * Auth: Basic Authorization header (any non-empty value passes in mock).
 * Lookup: ticketNo only — no msisdn/contractId needed.
 */

const router = require("express").Router();
const db     = require("../db");

router.get("/troubleTicket", (req, res) => {
  const { ticketNo } = req.query;
  if (!ticketNo) {
    return res.status(400).json({ error: "ticketNo query param is required" });
  }

  const t = db.findTicket(ticketNo);
  if (!t) return res.status(404).json({ error: `Ticket ${ticketNo} not found` });

  // Return in the exact shape the real SOA returns
  res.json([
    {
      ticketNo:          t.ticketNo,
      ticketType:        t.ticketType,
      priority:          t.priority,
      status:            t.status,
      description:       t.description,
      createdDate:       t.createdDate,
      modifiedDate:      t.modifiedDate,
      customerId:        [],
      accountId:         [t.contractId],
      productId:         [],
      publicIdentifier:  [t.msisdn],
      category: [
        { id: t.subCat, name: `${t.subCatName}-SMC`, ticketType: t.ticketType }
      ],
      note:              t.note,
      attachment:        t.attachment,
      customFields:      {},
    },
  ]);
});

module.exports = router;
