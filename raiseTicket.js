/**
 * routes/raiseTicket.js
 * POST /b2bSC_raiseTicket/v1
 *
 * Required body fields (from spec):
 *   msisdn, ticketType, service, category, subCat, title, summary, subCatName, callBackNumber
 *
 * contractId is resolved automatically from msisdn — agent only needs the phone number.
 * ticketNo is auto-generated and linked back to customer.ticket_ids[].
 */

const router = require("express").Router();
const db     = require("../db");

router.post("/", (req, res) => {
  const {
    msisdn,          // primary lookup key — replaces manual contractId entry
    ticketType,
    service,
    category,
    subCat,
    title,
    summary,
    subCatName,
    callBackNumber,
    supportDocsList,
  } = req.body;

  // ── Validate required fields ─────────────────────────────────
  const missing = [];
  if (!msisdn)       missing.push("msisdn");
  if (!ticketType)   missing.push("ticketType");
  if (!service)      missing.push("service");
  if (!category)     missing.push("category");
  if (!subCat)       missing.push("subCat");
  if (!title)        missing.push("title");
  if (!summary)      missing.push("summary");
  if (!subCatName)   missing.push("subCatName");
  if (!callBackNumber) missing.push("callBackNumber");

  if (missing.length) {
    return res.status(400).json({
      statusCode:   "1",
      stausMessage: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  // ── Resolve customer from msisdn ─────────────────────────────
  const customer = db.findCustomer(msisdn);
  if (!customer) {
    return res.status(404).json({
      statusCode:   "1",
      stausMessage: `No customer found for msisdn ${msisdn}`,
    });
  }

  const ticketNo  = db.newTicketNo();
  const now       = new Date().toISOString();

  const newTicket = {
    ticketNo,
    ticketType,
    service,
    category,
    subCat,
    subCatName,
    title,
    summary,
    priority:    "High",
    status:      "Open",
    msisdn:      customer.msisdn,
    contractId:  customer.id,
    callBackNumber,
    description: `title=${title}| type=${ticketType}| service=${service}| category=${category}| subCategoryName=${subCatName}| summary=${summary}`,
    note:        [],
    attachment:  supportDocsList || [],
    createdDate: now,
    modifiedDate: now,
  };

  db.saveTicket(newTicket);

  // Link back to customer
  customer.ticket_ids.push(ticketNo);
  db.saveCustomer(customer);

  res.status(201).json({
    statusCode:   "0",
    stausMessage: "success",
    ticketNumber: ticketNo,
  });
});

module.exports = router;
