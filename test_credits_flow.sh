#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'username=admin@cadence.ai&password=admin123' | jq -r '.access_token')

echo "Testing Credit Tracking Feature"
echo "================================"
echo ""
echo "Token: ${TOKEN:0:40}..."
echo ""

# Test 1: Get credits (should auto-initialize)
echo "TEST 1: Get User Credits"
echo "curl GET /api/v1/discovery/credits"
curl -s -X GET "http://localhost:8000/api/v1/discovery/credits" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""
echo "---"
echo ""

# Test 2: Discovery search with credit deduction
echo "TEST 2: Search Creators (with credit deduction)"
echo "curl POST /api/v1/discovery/search"
curl -s -X POST "http://localhost:8000/api/v1/discovery/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tech",
    "filters": {
      "platform": "instagram"
    }
  }' | jq '{total: .total, accounts_count: (.accounts | length), credits_deducted: .credits_deducted, credits_remaining: .credits_remaining}'
echo ""
echo "---"
echo ""

# Test 3: Check credits again
echo "TEST 3: Check Credits After Search"
echo "curl GET /api/v1/discovery/credits"
curl -s -X GET "http://localhost:8000/api/v1/discovery/credits" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.balance, .percent_used, .transaction_history[0:3]'
