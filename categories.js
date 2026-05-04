/**
 * routes/categories.js
 * POST /b2bSC_getCatagories/v2   (spelling preserved from real spec)
 *
 * Returns the full ticket-type → service → category → subCategory tree.
 * Agent uses this to populate dropdowns before raising a ticket.
 * Auth: Bearer API key (any non-empty value passes in mock).
 */

const router = require("express").Router();
const db     = require("../db");

// Spec says POST with empty body — we honour that but also accept GET
router.post("/", (req, res) => {
  res.json(db.getCategories());
});

router.get("/", (req, res) => {
  res.json(db.getCategories());
});

module.exports = router;
