/**
 * routes/customers.js
 * Lookup key: msisdn (phone number) or customer id
 */

const router = require("express").Router();
const db     = require("../db");

// GET /customers — list all
router.get("/", (req, res) => {
  const list = db.getCustomers();
  res.json({ total: list.length, customers: list });
});

// GET /customers/:id — by customer id OR msisdn
router.get("/:id", (req, res) => {
  const c = db.findCustomer(req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  res.json(c);
});

// POST /customers — create new customer
// Required: customer_name, msisdn
router.post("/", (req, res) => {
  const { customer_name, msisdn, package_name, package_type,
          data_quota_mb, validity_days, current_balance } = req.body;

  if (!customer_name || !msisdn) {
    return res.status(400).json({ error: "customer_name and msisdn are required" });
  }

  // Prevent duplicate msisdn
  if (db.findCustomer(msisdn)) {
    return res.status(409).json({ error: `Customer with msisdn ${msisdn} already exists` });
  }

  const newCustomer = {
    id:                  `cust-${Date.now().toString(36)}`,
    customer_name,
    msisdn,
    package_name:        package_name  || "",
    package_type:        package_type  || "prepaid",
    data_quota_mb:       data_quota_mb || 0,
    validity_days:       validity_days || 30,
    current_balance:     current_balance || 0,
    last_flexiload_date: null,
    last_trxid:          null,
    ticket_ids:          [],
  };

  db.saveCustomer(newCustomer);
  res.status(201).json(newCustomer);
});

// PATCH /customers/:id — update allowed fields
router.patch("/:id", (req, res) => {
  const c = db.findCustomer(req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });

  const allowed = ["current_balance", "package_name", "package_type",
                   "data_quota_mb", "validity_days",
                   "last_flexiload_date", "last_trxid"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) c[f] = req.body[f]; });

  db.saveCustomer(c);
  res.json(c);
});

// DELETE /customers/:id
router.delete("/:id", (req, res) => {
  const c = db.findCustomer(req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  db.deleteCustomer(c.id);
  res.json({ message: `Customer ${c.id} (${c.msisdn}) deleted` });
});

module.exports = router;
