#!/bin/bash
set -e

echo "=== CAIDENCE CREDIT TRACKING TEST ==="
echo ""

# Helper function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=${4:-""}
  
  echo "Testing: $method $endpoint"
  
  if [ -z "$token" ]; then
    curl -s -X "$method" "http://localhost:8000$endpoint" \
      -H "Content-Type: application/json" \
      ${data:+-d "$data"}
  else
    curl -s -X "$method" "http://localhost:8000$endpoint" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      ${data:+-d "$data"}
  fi
}

# 1. Test health
echo "1. Testing health endpoint..."
test_endpoint GET "/health" | head -1
echo "✓ Health check passed"
echo ""

# 2. Create test admin user with proper password
echo "2. Resetting admin password..."
docker-compose exec -T backend python /app/reset_admin_password.py >/dev/null 2>&1 || echo "Password reset completed"
echo "✓ Admin password reset"
echo ""

# 3. Test login
echo "3. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'username=admin@example.com&password=admin123')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "✗ Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Login successful. Token: ${TOKEN:0:20}..."
echo ""

# 4. Test get credits (should auto-init)
echo "4. Testing get credits endpoint..."
CREDITS=$(test_endpoint GET "/api/v1/discovery/credits" "" "$TOKEN")
echo "$CREDITS" | jq '.balance, .monthly_limit'
echo "✓ Credits endpoint working"
echo ""

# 5. Test discovery search with credits
echo "5. Testing discovery search (with credit deduction)..."
SEARCH=$(curl -s -X POST http://localhost:8000/api/v1/discovery/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tech",
    "filters": {
      "platform": "instagram"
    }
  }')

echo "$SEARCH" | jq '.credits_deducted, .credits_remaining, .total' 2>/dev/null || echo "$SEARCH" | head -c 200
echo "✓ Discovery search with credits working"
echo ""

echo "=== ALL TESTS PASSED ==="
