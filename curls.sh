#!/bin/bash

BASE_URL="http://localhost:8000"
TOKEN="test-token"

MSISDN="01812345678"
TICKET=""

echo "🚀 Starting API Test..."
echo "----------------------------------"

# Health Check
echo "🔹 Health Check"
curl -s $BASE_URL/health | jq
echo -e "\n----------------------------------"

# Create Customer
echo "🔹 Create Customer"
curl -s -X POST $BASE_URL/customers \
-H "Authorization: $TOKEN" \
-H "Content-Type: application/json" \
-d "{
  \"customer_name\": \"Test User\",
  \"msisdn\": \"$MSISDN\"
}" | jq
echo -e "\n----------------------------------"

# Get Customer
echo "🔹 Get Customer"
curl -s -X GET $BASE_URL/customers/$MSISDN \
-H "Authorization: $TOKEN" | jq
echo -e "\n----------------------------------"

# Update Customer
echo "🔹 Update Customer"
curl -s -X PATCH $BASE_URL/customers/$MSISDN \
-H "Authorization: $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "current_balance": 999,
  "package_name": "Test Pack"
}' | jq
echo -e "\n----------------------------------"

# Create Ticket
echo "🔹 Create Ticket"
RESPONSE=$(curl -s -X POST $BASE_URL/b2bSC_raiseTicket/v1 \
-H "Authorization: $TOKEN" \
-H "Content-Type: application/json" \
-d "{
  \"msisdn\": \"$MSISDN\",
  \"summary\": \"Test issue from curl script\"
}")

echo $RESPONSE | jq

# Extract TicketNo
TICKET=$(echo $RESPONSE | jq -r '.ticket.ticketNo')

echo "🎫 Ticket Created: $TICKET"
echo -e "\n----------------------------------"

# Get Ticket
echo "🔹 Get Ticket"
curl -s -X GET $BASE_URL/tickets/$TICKET \
-H "Authorization: $TOKEN" | jq
echo -e "\n----------------------------------"

# Update Ticket
echo "🔹 Update Ticket"
curl -s -X PATCH $BASE_URL/tickets/$TICKET \
-H "Authorization: $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "status": "Resolved",
  "note": "Resolved via curl test"
}' | jq
echo -e "\n----------------------------------"

# Get Customer Tickets
echo "🔹 Get Customer Tickets"
curl -s -X GET $BASE_URL/customers/$MSISDN/tickets \
-H "Authorization: $TOKEN" | jq
echo -e "\n----------------------------------"

# SOA Endpoint
echo "🔹 SOA Ticket View"
curl -s -X GET $BASE_URL/DigitalService/TroubleTicketRestService/troubleTicket/$TICKET \
-H "Authorization: $TOKEN" | jq
echo -e "\n----------------------------------"

# Delete Ticket
echo "🔹 Delete Ticket"
curl -s -X DELETE $BASE_URL/tickets/$TICKET \
-H "Authorization: $TOKEN" | jq
echo -e "\n----------------------------------"

# Delete Customer
echo "🔹 Delete Customer"
curl -s -X DELETE $BASE_URL/customers/$MSISDN \
-H "Authorization: $TOKEN" | jq
echo -e "\n----------------------------------"

echo "✅ Test Completed"