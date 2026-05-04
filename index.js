/**
 * db.js — Simple JSON file-backed store
 * Reads once into memory on boot; flushes to disk on every write.
 * Two collections: customers, tickets. Categories are read-only.
 */

const fs   = require("fs");
const path = require("path");

const FILES = {
  customers:  path.join(__dirname, "customers.json"),
  tickets:    path.join(__dirname, "tickets.json"),
  categories: path.join(__dirname, "categories.json"),
};

// ── In-memory cache ──────────────────────────────────────────
const cache = {};

function load(name) {
  if (!cache[name]) {
    const raw = fs.readFileSync(FILES[name], "utf8");
    const parsed = JSON.parse(raw);
    // Each file has a top-level key matching the collection name
    const key = Object.keys(parsed)[0];
    cache[name] = { key, data: parsed[key] };
  }
  return cache[name].data;
}

function flush(name) {
  const { key, data } = cache[name];
  fs.writeFileSync(FILES[name], JSON.stringify({ [key]: data }, null, 2), "utf8");
}

// ── Customers ────────────────────────────────────────────────
function getCustomers()       { return load("customers"); }

function findCustomer(idOrMsisdn) {
  return load("customers").find(
    (c) => c.id === idOrMsisdn || c.msisdn === idOrMsisdn
  );
}

function saveCustomer(customer) {
  const list = load("customers");
  const idx  = list.findIndex((c) => c.id === customer.id);
  if (idx === -1) list.push(customer);
  else            list[idx] = customer;
  flush("customers");
  return customer;
}

function deleteCustomer(id) {
  const list = load("customers");
  const idx  = list.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  flush("customers");
  return true;
}

// ── Tickets ──────────────────────────────────────────────────
function getTickets()         { return load("tickets"); }

function findTicket(ticketNo) {
  return load("tickets").find((t) => t.ticketNo === ticketNo);
}

function saveTicket(ticket) {
  const list = load("tickets");
  const idx  = list.findIndex((t) => t.ticketNo === ticket.ticketNo);
  if (idx === -1) list.push(ticket);
  else            list[idx] = ticket;
  flush("tickets");
  return ticket;
}

function deleteTicket(ticketNo) {
  const list = load("tickets");
  const idx  = list.findIndex((t) => t.ticketNo === ticketNo);
  if (idx === -1) return false;
  list.splice(idx, 1);
  flush("tickets");
  return true;
}

// ── Categories (read-only) ────────────────────────────────────
function getCategories()      { return load("categories"); }

// ── Ticket ID generator ───────────────────────────────────────
function newTicketNo() {
  return `TT${Math.floor(100000 + Math.random() * 900000)}`;
}

module.exports = {
  getCustomers, findCustomer, saveCustomer, deleteCustomer,
  getTickets,   findTicket,   saveTicket,   deleteTicket,
  getCategories,
  newTicketNo,
};
