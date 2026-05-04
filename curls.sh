#!/bin/bash
# Trouble Ticket Mock API — cURL Reference
# Base: http://localhost:8000
# Auth: any non-empty Bearer token passes

BASE="http://localhost:8000"
TOKEN="test-token"

# ── HEALTH (no auth) ──────────────────────────────────────────
curl "$BASE/health"


# ── SOA: Get ticket by ticketNo ───────────────────────────────
curl "$BASE/DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT105368" \
  -H "Authorization: Bearer $TOKEN"


# ── RAISE: Create a new ticket ────────────────────────────────
# Required: contractId, ticketType, category
curl -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "1007504943",
    "ticketType": "Complaint",
    "category":   "Network Issue"
  }'
# Returns: { "statusCode": "0", "stausMessage": "success", "ticketNumber": "TT######" }


# ── CRUD: List all tickets for a contract ─────────────────────
# Required query: contractId
curl "$BASE/tickets?contractId=1007504943" \
  -H "Authorization: Bearer $TOKEN"


# ── CRUD: Get one ticket ──────────────────────────────────────
# Required: ticketNo (path) + contractId (query)
curl "$BASE/tickets/TT105368?contractId=1007504943" \
  -H "Authorization: Bearer $TOKEN"


# ── CRUD: Update ticket ───────────────────────────────────────
# Required body: contractId + at least one of status / priority / note
curl -X PATCH "$BASE/tickets/TT105368" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "1007504943",
    "status":     "InProgress"
  }'


# ── CRUD: Delete ticket ───────────────────────────────────────
# Required body: contractId
curl -X DELETE "$BASE/tickets/TT105368" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "contractId": "1007504943" }'
