#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Ticket Mock API — Full cURL Test Suite
# Base URL : http://localhost:8000
# Auth     : any non-empty Bearer token passes
#
# Pre-seeded data:
#   msisdn        customer        tickets
#   01711234567   Rahim Uddin     TT105368 (Open)
#   01812345678   Fatema Begum    (none)
#   01911223344   Karim Hassan    TT193426 (Closed), TT536791 (InProgress)
#   01755667788   Nadia Islam     (none)
# ═══════════════════════════════════════════════════════════════

BASE="http://localhost:8000"
AUTH="Authorization: Bearer demo-token"


# ┌─────────────────────────────────────────────────────────────┐
# │ HEALTH                                                      │
# └─────────────────────────────────────────────────────────────┘

# No auth required
# Expected: { "status": "ok", "customers": 4, "tickets": 3 }
curl -s "$BASE/health" | jq .


# ┌─────────────────────────────────────────────────────────────┐
# │ SPEC 1 — GET TICKET STATUS (SOA)                           │
# │ Lookup by ticketNo only                                    │
# └─────────────────────────────────────────────────────────────┘

# Get Open ticket
# Expected: array[1] with status=Open, msisdn=01711234567
curl -s "$BASE/DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT105368" \
  -H "$AUTH" \
  -H "Version: 1" \
  -H "SequenceId: 1" \
  -H "TransactionId: 1" \
  -H "SenderHostName: 127.0.0.1" \
  -H "SerialNo: 21212122" \
  -H "CreationTimeStamp: 20200518104100" \
  -H "DeliveryChannelType: B2BBOT" \
  -H "RequestType: Event" \
  -H "BusinessProcessId: getIndividualCustomerProfile" \
  -H "OperatorId: 1025" | jq .

# Get Closed ticket
curl -s "$BASE/DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT193426" \
  -H "$AUTH" | jq '.[0] | {ticketNo, status, priority}'

# Get InProgress ticket
curl -s "$BASE/DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT536791" \
  -H "$AUTH" | jq '.[0] | {ticketNo, status, category: .category[0].name}'

# ERROR: ticket not found
# Expected: 404 { "error": "Ticket TT000000 not found" }
curl -s "$BASE/DigitalService/TroubleTicketRestService/troubleTicket?ticketNo=TT000000" \
  -H "$AUTH" | jq .

# ERROR: missing ticketNo param
# Expected: 400 { "error": "ticketNo query param is required" }
curl -s "$BASE/DigitalService/TroubleTicketRestService/troubleTicket" \
  -H "$AUTH" | jq .


# ┌─────────────────────────────────────────────────────────────┐
# │ SPEC 2 — GET TICKET TYPES                                  │
# │ Returns type → service → category → subCategory tree       │
# │ Use subCategory.id as subCat when raising a ticket         │
# └─────────────────────────────────────────────────────────────┘

# Full tree
curl -s -X POST "$BASE/b2bSC_getCatagories/v2" \
  -H "$AUTH" | jq .

# Just the type labels
curl -s -X POST "$BASE/b2bSC_getCatagories/v2" \
  -H "$AUTH" | jq '[.type[].label]'

# Drill into Complaint > Fixed > Network Issue subCategories
curl -s -X POST "$BASE/b2bSC_getCatagories/v2" \
  -H "$AUTH" | jq '.type[] | select(.label=="Complaint") | .service[] | select(.label=="Fixed") | .category[] | select(.label=="Network Issue") | .subCategory'


# ┌─────────────────────────────────────────────────────────────┐
# │ SPEC 3 — RAISE TICKET                                      │
# │ Required: msisdn, ticketType, service, category,           │
# │           subCat, title, summary, subCatName, callBackNumber│
# │ Returns: { statusCode, stausMessage, ticketNumber }        │
# └─────────────────────────────────────────────────────────────┘

# Raise a Complaint > Fixed > Network Issue ticket
# Expected: { "statusCode": "0", "stausMessage": "success", "ticketNumber": "TT######" }
curl -s -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "msisdn":         "01711234567",
    "ticketType":     "Complaint",
    "service":        "Fixed",
    "category":       "Network Issue",
    "subCat":         "TC0110211613",
    "title":          "Chatbot Ticket (TEST)",
    "summary":        "No signal since 9am at Mirpur-10",
    "subCatName":     "Reachability",
    "callBackNumber": "01711234567"
  }' | jq .

# Raise a Billing complaint for Karim Hassan
curl -s -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "msisdn":         "01911223344",
    "ticketType":     "Complaint",
    "service":        "Mobility",
    "category":       "Billing",
    "subCat":         "TC0220311001",
    "title":          "Bill Dispute",
    "summary":        "Wrong charge on April bill",
    "subCatName":     "Overcharge",
    "callBackNumber": "01911223344"
  }' | jq .

# ERROR: missing required field (subCat omitted)
# Expected: 400 { "statusCode": "1", "stausMessage": "Missing required fields: subCat" }
curl -s -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "msisdn":     "01711234567",
    "ticketType": "Complaint",
    "service":    "Fixed",
    "category":   "Network Issue"
  }' | jq .

# ERROR: msisdn not in DB
# Expected: 404 { "statusCode": "1", "stausMessage": "No customer found for msisdn ..." }
curl -s -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "msisdn":         "01999999999",
    "ticketType":     "Complaint",
    "service":        "Fixed",
    "category":       "Network Issue",
    "subCat":         "TC0110211613",
    "title":          "Test",
    "summary":        "Test",
    "subCatName":     "Reachability",
    "callBackNumber": "01999999999"
  }' | jq .


# ┌─────────────────────────────────────────────────────────────┐
# │ CUSTOMERS — CRUD helpers                                   │
# └─────────────────────────────────────────────────────────────┘

# List all customers
curl -s "$BASE/customers" \
  -H "$AUTH" | jq '{total, customers: [.customers[] | {id, customer_name, msisdn, ticket_ids}]}'

# Get by msisdn
curl -s "$BASE/customers/01711234567" \
  -H "$AUTH" | jq .

# Get by customer id
curl -s "$BASE/customers/cust-003" \
  -H "$AUTH" | jq .

# Create new customer
# Expected: 201 with new customer object
curl -s -X POST "$BASE/customers" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"customer_name":"Ahmed Ali","msisdn":"01911000001"}' | jq .

# ERROR: duplicate msisdn
# Expected: 409 { "error": "msisdn 01711234567 already exists" }
curl -s -X POST "$BASE/customers" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"customer_name":"Duplicate","msisdn":"01711234567"}' | jq .

# Update balance
curl -s -X PATCH "$BASE/customers/01711234567" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"current_balance":999}' | jq '{id, customer_name, current_balance}'

# Delete a customer (use the one we just created)
curl -s -X DELETE "$BASE/customers/01911000001" \
  -H "$AUTH" | jq .

# ERROR: customer not found
# Expected: 404
curl -s -X DELETE "$BASE/customers/01000000000" \
  -H "$AUTH" | jq .


# ┌─────────────────────────────────────────────────────────────┐
# │ TICKETS — CRUD helpers                                     │
# │ msisdn required for ownership check on all operations      │
# └─────────────────────────────────────────────────────────────┘

# List all tickets for a phone number
curl -s "$BASE/tickets?msisdn=01711234567" \
  -H "$AUTH" | jq '{total, tickets: [.tickets[] | {ticketNo, status, priority}]}'

# List tickets for Karim Hassan (has 2 tickets)
curl -s "$BASE/tickets?msisdn=01911223344" \
  -H "$AUTH" | jq '{total, tickets: [.tickets[] | {ticketNo, status}]}'

# List tickets for customer with no tickets
curl -s "$BASE/tickets?msisdn=01812345678" \
  -H "$AUTH" | jq .

# Get one ticket
curl -s "$BASE/tickets/TT105368?msisdn=01711234567" \
  -H "$AUTH" | jq .

# ERROR: wrong msisdn for ticket
# Expected: 403 { "error": "Ticket does not belong to this msisdn" }
curl -s "$BASE/tickets/TT105368?msisdn=01911223344" \
  -H "$AUTH" | jq .

# Update status
# Expected: { "message": "Ticket updated", ticket: { status: "InProgress", ... } }
curl -s -X PATCH "$BASE/tickets/TT105368" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01711234567","status":"InProgress"}' | jq '{message, ticketNo: .ticket.ticketNo, status: .ticket.status}'

# Update priority
curl -s -X PATCH "$BASE/tickets/TT105368" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01711234567","priority":"Critical"}' | jq '{message, priority: .ticket.priority}'

# Add a note
curl -s -X PATCH "$BASE/tickets/TT105368" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01711234567","note":"Agent followed up. Customer confirmed issue persists."}' | jq '{message, notes: .ticket.note}'

# ERROR: wrong msisdn on PATCH
# Expected: 403
curl -s -X PATCH "$BASE/tickets/TT105368" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01911223344","status":"Closed"}' | jq .

# Delete a ticket (raise one first, then delete it)
NEW_TICKET=$(curl -s -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01812345678","ticketType":"Complaint","service":"Fixed","category":"Network Issue","subCat":"TC0110211613","title":"Temp Ticket","summary":"Will be deleted","subCatName":"Reachability","callBackNumber":"01812345678"}' | jq -r '.ticketNumber')

echo "Created ticket: $NEW_TICKET"

curl -s -X DELETE "$BASE/tickets/$NEW_TICKET" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{"msisdn":"01812345678"}' | jq .

# Verify it's gone — Expected: 404
curl -s "$BASE/tickets/$NEW_TICKET?msisdn=01812345678" \
  -H "$AUTH" | jq .


# ┌─────────────────────────────────────────────────────────────┐
# │ AUTH ERRORS                                                │
# └─────────────────────────────────────────────────────────────┘

# Missing auth header
# Expected: 401 { "error": "Unauthorized", "hint": "..." }
curl -s "$BASE/customers" | jq .

# Invalid JSON body
# Expected: 400 { "error": "Invalid JSON in request body" }
curl -s -X POST "$BASE/b2bSC_raiseTicket/v1" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  --data-raw '{bad json}' | jq .
