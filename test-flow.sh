#!/bin/bash
# Adventures Of - Validation Test Script

BASE_URL="https://adventures-of.onrender.com"

echo "Testing Adventures Of - End to End"
echo "=================================="

# Test 1: Health Check
echo ""
echo "1. Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "$HEALTH"
if echo "$HEALTH" | grep -q "ok"; then
    echo "PASS: Health check"
else
    echo "FAIL: Health check"
    exit 1
fi

# Test 2: Generate Book
echo ""
echo "2. Generating test book..."
BOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "childName": "TestChild",
    "childAge": "5",
    "interests": ["dinosaurs", "space", "animals"],
    "favoriteThing": "pizza",
    "fearToAvoid": "darkness",
    "readingLevel": "medium",
    "photo": null
  }')

echo "Response received"

if echo "$BOOK_RESPONSE" | grep -q "success"; then
    echo "PASS: Book generation"
else
    echo "FAIL: Book generation"
    exit 1
fi

# Test 3: Verify PDF exists
echo ""
echo "3. Checking PDF download..."
DOWNLOAD_URL=$(echo "$BOOK_RESPONSE" | grep -o '"/output/[^"]*"' | head -1 | tr -d '"')
echo "PDF URL: $DOWNLOAD_URL"

if [ -n "$DOWNLOAD_URL" ]; then
    PDF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$DOWNLOAD_URL")
    echo "HTTP Status: $PDF_STATUS"
    if [ "$PDF_STATUS" = "200" ]; then
        echo "PASS: PDF download"
    else
        echo "FAIL: PDF download (status: $PDF_STATUS)"
    fi
else
    echo "FAIL: No PDF URL found"
fi

# Test 4: Frontend loads
echo ""
echo "4. Checking frontend..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
echo "HTTP Status: $FRONTEND"
if [ "$FRONTEND" = "200" ]; then
    echo "PASS: Frontend loads"
else
    echo "FAIL: Frontend (status: $FRONTEND)"
fi

# Test 5: Payment link endpoint
echo ""
echo "5. Checking payment link..."
PAYMENT=$(curl -s "$BASE_URL/api/payment-link")
echo "$PAYMENT"
if echo "$PAYMENT" | grep -q "cash.app"; then
    echo "PASS: Payment link"
else
    echo "FAIL: Payment link"
fi

echo ""
echo "=================================="
echo "Validation Complete!"
