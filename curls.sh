#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Ticket Mock API — cURL Reference
# Base: http://localhost:8000
# Auth: any non-empty Bearer token passes in mock
#
# Primary keys:
#   msisdn   → identifies customer (phone number)
#   ticketNo → identifies ticket
#
# All JSON bodies use --data-raw (avoids shell escaping issues)
# ═══════════════════════════════════════════════════════════════

BASE="http://localhost:8000"
TOKEN="Bearer demo-token"

# ─────────────────────────────────────────────
# HEALTH  (no auth)
# ─────────────────────────────────────────────
curl "$BASE/health"


# ═════════════════════════════════════════════
# SOA — GET TICKET STATUS
# Spec: GET /DigitalService/TroubleTicketRestService/troubleTicket
# Lookup: ticketNo only
# ═════════════════════════════════════════════
curl "$BASE/DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT105368" \
  -H "Authorization: $TOKEN" \
  -H "Version: 1" \
  -H "SequenceId: 1" \
  -H "TransactionId: 1" \
  -H "SenderHostName: 127.0.0.1" \
  -H "SerialNo: 21212122" \
  -H "CreationTimeStamp: 20200518104100" \
  -H "DeliveryChannelType: B2BBOT" \
  -H "RequestType: Event" \
  -H "BusinessProcessId: getIndividualCustomerProfile" \
  -H "OperatorId: 1025"


# ═════════════════════════════════════════════
# GET TICKET TYPES
# Spec: POST /b2bSC_getCatagories/v2
# Returns: type → service → category → subCategory tree
# Agent uses subCategory.id as subCat when raising a ticket
# ═════════════════════════════════════════════
curl -X POST "$BASE/b2bSC_getCatagories/v2" \
  -H "Authorization: $TOKEN"


# ═════════════════════════════════════════════
# RAISE TICKET
# Spec: POST /b2bSC_raiseTicket/v1
# Required: all fields below
# msisdn replaces contractId — server resolves customer automatically
# Returns: { statusCode, stausMessage, ticketNumber }
# ═════════════════════════════════════════════
curl -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01711234567","ticketType":"Complaint","service":"Fixed","category":"Network Issue","subCat":"TC0110211613","title":"Chatbot Ticket (TEST)","summary":"No signal at Mirpur-10","subCatName":"Reachability","callBackNumber":"01711234567"}'


# ═════════════════════════════════════════════
# CUSTOMERS  (helper endpoints)
# ═════════════════════════════════════════════

# List all customers
curl "$BASE/customers" \
  -H "Authorization: $TOKEN"

# Get customer by msisdn (phone number)
curl "$BASE/customers/01711234567" \
  -H "Authorization: $TOKEN"

# Create customer  [required: customer_name, msisdn]
curl -X POST "$BASE/customers" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"customer_name":"Ahmed Ali","msisdn":"01911000001"}'

# Update customer field
curl -X PATCH "$BASE/customers/01711234567" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"current_balance":500}'

# Delete customer
curl -X DELETE "$BASE/customers/01711234567" \
  -H "Authorization: $TOKEN"


# ═════════════════════════════════════════════
# TICKETS CRUD  (helper endpoints)
# All operations need msisdn for ownership verification
# ═════════════════════════════════════════════

# List all tickets for a phone number
curl "$BASE/tickets?msisdn=01711234567" \
  -H "Authorization: $TOKEN"

# Get one ticket
curl "$BASE/tickets/TT105368?msisdn=01711234567" \
  -H "Authorization: $TOKEN"

# Update ticket  [required: msisdn + one of: status, priority, note]
curl -X PATCH "$BASE/tickets/TT105368" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01711234567","status":"InProgress"}'

# Delete ticket  [unlinks from customer automatically]
curl -X DELETE "$BASE/tickets/TT105368" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01711234567"}'
