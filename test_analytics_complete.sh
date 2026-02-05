#!/bin/bash

# Comprehensive Analytics Test Suite
# Tests the entire analytics flow from backend to frontend

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Analytics Complete Test Suite                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠️ ${NC}$1"
}

info() {
    echo -e "${BLUE}ℹ️ ${NC}$1"
}

# Test 1: Docker Containers
echo -e "${PURPLE}[TEST 1/8] Docker Containers${NC}"
echo "═════════════════════════════════════════"
if docker ps | grep -q caidence-backend-1; then
    pass "Backend container is running"
else
    fail "Backend container is not running"
    exit 1
fi

if docker ps | grep -q caidence-frontend-1; then
    pass "Frontend container is running"
else
    fail "Frontend container is not running"
    exit 1
fi

if docker ps | grep -q caidence-db-1; then
    pass "Database container is running"
else
    fail "Database container is not running"
    exit 1
fi
echo ""

# Test 2: Backend Health
echo -e "${PURPLE}[TEST 2/8] Backend Health${NC}"
echo "═════════════════════════════════════════"
HEALTH=$(curl -s http://localhost:8000/health || echo "")
if [ "$HEALTH" = "ok" ]; then
    pass "Backend health check successful"
else
    fail "Backend health check failed (expected 'ok', got: '$HEALTH')"
fi
echo ""

# Test 3: Database Connection
echo -e "${PURPLE}[TEST 3/8] Database Connection${NC}"
echo "═════════════════════════════════════════"
DB_CHECK=$(docker exec caidence-db-1 psql -U postgres -d caidence_db -c "SELECT 1;" 2>&1 | grep -c "1 row")
if [ "$DB_CHECK" -gt 0 ]; then
    pass "Database is accessible"
else
    fail "Cannot access database"
fi

# Check if analytics tables exist
TABLES=$(docker exec caidence-db-1 psql -U postgres -d caidence_db -c "
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema='public' AND table_name IN ('campaign_analytics', 'campaigns');
" 2>&1 | grep -o "[0-9]" | head -1)

if [ "$TABLES" -gt 0 ]; then
    pass "Analytics tables exist"
else
    warn "Analytics tables might be missing (but API might create them)"
fi
echo ""

# Test 4: JWT Token
echo -e "${PURPLE}[TEST 4/8] JWT Token Handling${NC}"
echo "═════════════════════════════════════════"
echo "You need a JWT token to test authenticated endpoints."
echo "To get your token:"
echo "  1. Go to http://localhost:3000"
echo "  2. Open DevTools (F12)"
echo "  3. Run: localStorage.getItem('token')"
echo ""

read -p "Paste your JWT token (or press Enter to skip): " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    warn "Skipping authenticated tests (no token provided)"
    SKIP_AUTH=1
else
    # Validate token format (basic check)
    if [[ $JWT_TOKEN =~ ^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
        pass "Token format is valid (JWT structure)"
    else
        warn "Token format looks unusual (might still work)"
    fi
fi
echo ""

# Test 5: Analytics Endpoint (if token available)
if [ -z "$SKIP_AUTH" ]; then
    echo -e "${PURPLE}[TEST 5/8] Analytics API Endpoint${NC}"
    echo "═════════════════════════════════════════"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:8000/api/v1/analytics/dashboard" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        pass "Analytics endpoint returned 200 OK"
        
        # Check response structure
        if echo "$BODY" | jq . >/dev/null 2>&1; then
            pass "Response is valid JSON"
            
            # Check required fields
            if echo "$BODY" | jq -e '.overview' >/dev/null 2>&1; then
                pass "Response has 'overview' field"
            else
                fail "Response missing 'overview' field"
            fi
            
            if echo "$BODY" | jq -e '.trends' >/dev/null 2>&1; then
                pass "Response has 'trends' field"
            else
                fail "Response missing 'trends' field"
            fi
            
            if echo "$BODY" | jq -e '.audience' >/dev/null 2>&1; then
                pass "Response has 'audience' field"
            else
                fail "Response missing 'audience' field"
            fi
        else
            fail "Response is not valid JSON"
            echo "Response: $BODY"
        fi
    elif [ "$HTTP_CODE" = "401" ]; then
        fail "Analytics endpoint returned 401 (unauthorized - invalid token)"
    elif [ "$HTTP_CODE" = "403" ]; then
        fail "Analytics endpoint returned 403 (forbidden - missing permission)"
    elif [ "$HTTP_CODE" = "500" ]; then
        fail "Analytics endpoint returned 500 (server error)"
        warn "Backend error: $BODY"
    else
        fail "Analytics endpoint returned unexpected status: $HTTP_CODE"
    fi
else
    echo -e "${PURPLE}[TEST 5/8] Analytics API Endpoint${NC}"
    echo "═════════════════════════════════════════"
    warn "Skipped (no token provided)"
fi
echo ""

# Test 6: Auth Endpoint
if [ -z "$SKIP_AUTH" ]; then
    echo -e "${PURPLE}[TEST 6/8] Auth Verification${NC}"
    echo "═════════════════════════════════════════"
    
    AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:8000/api/v1/auth/me" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json")
    
    AUTH_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
    AUTH_BODY=$(echo "$AUTH_RESPONSE" | head -n-1)
    
    if [ "$AUTH_CODE" = "200" ]; then
        pass "Auth endpoint verified token"
        
        if echo "$AUTH_BODY" | jq -e '.id' >/dev/null 2>&1; then
            USER_ID=$(echo "$AUTH_BODY" | jq -r '.id')
            pass "Retrieved user ID: $USER_ID"
        fi
    else
        fail "Auth endpoint returned $AUTH_CODE"
    fi
else
    echo -e "${PURPLE}[TEST 6/8] Auth Verification${NC}"
    echo "═════════════════════════════════════════"
    warn "Skipped (no token provided)"
fi
echo ""

# Test 7: Frontend Assets
echo -e "${PURPLE}[TEST 7/8] Frontend Assets${NC}"
echo "═════════════════════════════════════════"
if curl -s http://localhost:3000 | grep -q "React"; then
    pass "Frontend is serving pages"
else
    warn "Could not verify frontend (might still be running)"
fi

# Check if specific analytics component file exists (in source)
if [ -f "frontend/src/app/analytics/page.tsx" ]; then
    pass "Analytics page component exists"
else
    fail "Analytics page component not found"
fi

if [ -f "frontend/src/lib/api/analytics.ts" ]; then
    pass "Analytics API module exists"
else
    fail "Analytics API module not found"
fi
echo ""

# Test 8: Feature Flags & Config
echo -e "${PURPLE}[TEST 8/8] Configuration${NC}"
echo "═════════════════════════════════════════"
if grep -q "INFLUENCERS_CLUB_API_KEY" backend/.env 2>/dev/null; then
    pass "INFLUENCERS_CLUB_API_KEY is configured"
else
    warn "INFLUENCERS_CLUB_API_KEY not found in backend/.env"
fi

if [ -f "backend/app/api/endpoints/discovery.py" ]; then
    pass "Discovery endpoints are configured"
else
    warn "Discovery endpoints not found"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  TEST SUMMARY                                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Analytics should be working. If you're still seeing errors:"
    echo "  1. Clear browser cache: Ctrl+Shift+Del"
    echo "  2. Refresh page: F5"
    echo "  3. Check browser console: F12 → Console"
    echo "  4. Run: ./debug_analytics.sh"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review failures above"
    echo "  2. Check backend logs: docker logs caidence-backend-1"
    echo "  3. Restart containers: docker-compose restart"
    echo "  4. Run debug script: ./debug_analytics.sh"
fi
echo ""

exit $FAIL_COUNT
