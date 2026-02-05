#!/bin/bash

# Test Script for Influencers.club API Integration
# This script tests all the new discovery/enrichment endpoints

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:8000/api/v1"
FRONTEND_URL="http://localhost:3000"

# You need to set this to a valid JWT token from your app
# Log in to http://localhost:3000, then get the token from localStorage['auth_token']
JWT_TOKEN="${INFLUENCERS_CLUB_TEST_TOKEN:-}"

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  JWT_TOKEN not set!${NC}"
    echo "Please set the token:"
    echo "  export INFLUENCERS_CLUB_TEST_TOKEN='your_jwt_token_here'"
    echo ""
    echo "To get your JWT token:"
    echo "  1. Open http://localhost:3000"
    echo "  2. Log in"
    echo "  3. Open browser DevTools (F12)"
    echo "  4. Go to Console tab and run: JSON.parse(localStorage.getItem('auth'))"
    echo "  5. Copy the 'access_token' value"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Influencers.club API Integration Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# TEST 1: Check API Credits
# ============================================================================
echo -e "${BLUE}[1] Checking API Credits...${NC}"
CREDITS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/discovery/credits" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $CREDITS_RESPONSE"
echo ""

# ============================================================================
# TEST 2: Keyword Search - Fitness Influencers on Instagram
# ============================================================================
echo -e "${BLUE}[2] Searching: 'Fitness influencers' on Instagram${NC}"
KEYWORD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/discovery/creators/search-keyword" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "keyword": "fitness and wellness coaches",
    "follower_min": 5000,
    "limit": 5
  }')

echo "Response:"
echo "$KEYWORD_RESPONSE" | jq '.' 2>/dev/null || echo "$KEYWORD_RESPONSE"
echo ""

# ============================================================================
# TEST 3: Keyword Search - Tech Creators on TikTok
# ============================================================================
echo -e "${BLUE}[3] Searching: 'Tech creators' on TikTok${NC}"
TECHSEARCH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/discovery/creators/search-keyword" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "tiktok",
    "keyword": "software engineering and coding tutorials",
    "follower_min": 2000,
    "limit": 5
  }')

echo "Response:"
echo "$TECHSEARCH_RESPONSE" | jq '.' 2>/dev/null || echo "$TECHSEARCH_RESPONSE"
echo ""

# ============================================================================
# TEST 4: Advanced Search - High Engagement Creators
# ============================================================================
echo -e "${BLUE}[4] Advanced Search: High engagement creators (>3% engagement)${NC}"
ADVANCED_RESPONSE=$(curl -s -X POST "$API_BASE_URL/discovery/creators/search" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "filters": {
      "engagement_percent": {
        "min": 3.0
      },
      "number_of_subscribers": {
        "min": 10000,
        "max": 500000
      },
      "is_monetizing": true,
      "location": ["United States"]
    },
    "limit": 10,
    "offset": 0
  }')

echo "Response:"
echo "$ADVANCED_RESPONSE" | jq '.' 2>/dev/null || echo "$ADVANCED_RESPONSE"
echo ""

# ============================================================================
# TEST 5: List Discovered Creators
# ============================================================================
echo -e "${BLUE}[5] Listing all discovered creators (limit 5)${NC}"
LIST_RESPONSE=$(curl -s -X GET "$API_BASE_URL/discovery/creators?limit=5&offset=0" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$LIST_RESPONSE" | jq '.' 2>/dev/null || echo "$LIST_RESPONSE"
echo ""

# ============================================================================
# TEST 6: Get Creator Statistics
# ============================================================================
echo -e "${BLUE}[6] Getting creator statistics${NC}"
STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/discovery/stats" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$STATS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATS_RESPONSE"
echo ""

# ============================================================================
# TEST 7: Enrichment - Get Full Profile for Specific Handle
# ============================================================================
echo -e "${BLUE}[7] Enriching profile: 'gymdarbae' on Instagram (full mode)${NC}"
echo -e "${YELLOW}   (This will consume 1 credit - using popular public figure)${NC}"
ENRICH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/discovery/creators/enrich" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "gymdarbae",
    "platform": "instagram",
    "enrichment_mode": "full",
    "email_required": "preferred"
  }')

echo "Response:"
echo "$ENRICH_RESPONSE" | jq '.' 2>/dev/null || echo "$ENRICH_RESPONSE"
echo ""

# ============================================================================
# TEST 8: Enrichment - Raw Mode (cheaper, faster)
# ============================================================================
echo -e "${BLUE}[8] Enriching profile: 'jsimonmercadante' on Instagram (raw mode)${NC}"
echo -e "${YELLOW}   (This will consume 0.03 credits - faster, less detail)${NC}"
RAW_ENRICH=$(curl -s -X POST "$API_BASE_URL/discovery/creators/enrich" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "jsimonmercadante",
    "platform": "instagram",
    "enrichment_mode": "raw",
    "email_required": "preferred"
  }')

echo "Response:"
echo "$RAW_ENRICH" | jq '.' 2>/dev/null || echo "$RAW_ENRICH"
echo ""

# ============================================================================
# Final Check - Credits After Tests
# ============================================================================
echo -e "${BLUE}[9] Final Credit Check${NC}"
FINAL_CREDITS=$(curl -s -X GET "$API_BASE_URL/discovery/credits" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $FINAL_CREDITS"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Test suite complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Check the frontend at: $FRONTEND_URL/discovery"
echo "  2. Run searches to see real creator data"
echo "  3. Check database for stored creators:"
echo "     docker exec caidence-db-1 psql -U postgres -d caidence_db -c 'SELECT COUNT(*) FROM influencers;'"
echo ""
