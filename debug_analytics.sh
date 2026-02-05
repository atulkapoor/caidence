#!/bin/bash

# Debug script for analytics page issues
# This helps identify what's wrong with the analytics endpoint

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Analytics Debugging Script                                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if backend is running
echo -e "${BLUE}Step 1: Checking Backend Status${NC}"
if ! docker ps | grep -q caidence-backend-1; then
    echo -e "${RED}❌ Backend container not running${NC}"
    echo "Start it with: docker-compose up -d backend"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Step 2: Check if backend is responding
echo -e "${BLUE}Step 2: Testing Backend API Health${NC}"
HEALTH=$(curl -s -X GET http://localhost:8000/health || echo "failed")
if [ "$HEALTH" = "failed" ]; then
    echo -e "${RED}❌ Backend API not responding${NC}"
    echo "Check logs: docker logs caidence-backend-1 | tail -50"
    exit 1
fi
echo -e "${GREEN}✅ Backend API is responding${NC}"
echo ""

# Step 3: Get JWT token instructions
echo -e "${BLUE}Step 3: Getting JWT Token${NC}"
echo "You need a valid JWT token to test the analytics endpoint."
echo ""
echo "To get your token:"
echo "  1. Open http://localhost:3000 in browser"
echo "  2. F12 to open developer console"
echo "  3. Run: localStorage.getItem('token')"
echo "  4. Copy the token value"
echo ""

read -p "Have you copied your JWT token? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping API tests..."
    exit 0
fi

read -p "Paste your JWT token here: " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ No token provided${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token set${NC}"
echo ""

# Step 4: Test analytics endpoint directly
echo -e "${BLUE}Step 4: Testing Analytics Endpoint${NC}"
RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/analytics/dashboard \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -w "\n%{http_code}")

# Split response and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Analytics endpoint working!${NC}"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ Unauthorized (401) - Invalid or expired token${NC}"
    echo "Try getting a fresh token and try again"
elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${RED}❌ Forbidden (403) - User may lack analytics_read permission${NC}"
    echo "Check database:"
    echo "  docker exec caidence-db-1 psql -U postgres -d caidence_db \\"
    echo "    -c \"SELECT * FROM user_permissions WHERE permission_name='analytics_read';\""
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}❌ Server Error (500) - Backend issue${NC}"
    echo "Check logs: docker logs caidence-backend-1 -f"
else
    echo -e "${YELLOW}⚠️ Unexpected status code: $HTTP_CODE${NC}"
fi

echo ""

# Step 5: Check user permissions
echo -e "${BLUE}Step 5: Checking User Permissions${NC}"
echo "Checking if user has required permissions..."

# Try to extract user ID from token (this is a simple check)
USER_INFO=$(curl -s -X GET http://localhost:8000/api/v1/auth/me \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" || echo "failed")

if echo "$USER_INFO" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✅ User authentication valid${NC}"
    echo "$USER_INFO" | jq .
else
    echo -e "${RED}❌ Could not retrieve user info${NC}"
fi

echo ""

# Step 6: Check browser console
echo -e "${BLUE}Step 6: Browser Console Check${NC}"
echo "To see the actual error happening in your browser:"
echo ""
echo "  1. Open http://localhost:3000/analytics"
echo "  2. Press F12 to open Developer Tools"
echo "  3. Go to the Console tab"
echo "  4. Look for red error messages"
echo "  5. Check the Network tab to see API requests"
echo "  6. Copy any error messages and share them"
echo ""

# Step 7: Database info
echo -e "${BLUE}Step 7: Database Tables Check${NC}"
echo "Checking if analytics tables exist in database..."

TABLES=$(docker exec caidence-db-1 psql -U postgres -d caidence_db \
    -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "Could not connect to DB")

if echo "$TABLES" | grep -q "analytics" || echo "$TABLES" | grep -q "campaign"; then
    echo -e "${GREEN}✅ Analytics-related tables found${NC}"
else
    echo -e "${YELLOW}⚠️ No analytics tables found${NC}"
    echo "This might be OK if data is stored in other tables"
fi

echo ""

# Step 8: Provide next steps
echo -e "${BLUE}Summary${NC}"
echo "================================"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API is working correctly!${NC}"
    echo ""
    echo "If you're still seeing an error in the browser:"
    echo "  1. Clear browser cache (Ctrl+Shift+Del)"
    echo "  2. Refresh the page (F5)"
    echo "  3. Check browser console for client-side errors"
    echo "  4. Make sure you're logged in (check /dashboard works)"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ Token is invalid or expired${NC}"
    echo ""
    echo "Solutions:"
    echo "  1. Log out from http://localhost:3000"
    echo "  2. Log back in"
    echo "  3. Get a fresh token and try again"
elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${RED}❌ User lacks required permissions${NC}"
    echo ""
    echo "Solutions:"
    echo "  1. Check if user has analytics_read permission"
    echo "  2. Add permission via: docker exec caidence-backend-1 python reset_admin_password.py"
    echo "  3. Or manually add permission via SQL"
fi

echo ""
echo "For more help:"
echo "  - Backend logs: docker logs caidence-backend-1 -f"
echo "  - Frontend logs: Check browser console (F12)"
echo "  - Database: docker exec caidence-db-1 psql -U postgres -d caidence_db"
