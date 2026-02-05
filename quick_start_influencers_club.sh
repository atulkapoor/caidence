#!/bin/bash

# Quick Setup: Get JWT Token and Test Influencers Club API
# This makes it easy to test the integration

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Quick Start: Influencers.club API Testing                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check if containers are running
echo "Step 1: Checking if Docker containers are running..."
if ! docker ps | grep -q caidence-backend-1; then
    echo "❌ Backend container is not running!"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

if ! docker ps | grep -q caidence-frontend-1; then
    echo "❌ Frontend container is not running!"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo "✅ Both containers are running"
echo ""

# Step 2: Check environment variable
echo "Step 2: Checking INFLUENCERS_CLUB_API_KEY..."
if grep -q "INFLUENCERS_CLUB_API_KEY" /Users/atulkapoor/Documents/C\(AI\)DENCE/backend/.env 2>/dev/null; then
    echo "✅ API key found in .env file"
else
    echo "⚠️  API key not found in backend/.env"
    echo "Add this line to backend/.env:"
    echo ""
    echo 'INFLUENCERS_CLUB_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMzc1MDkwNTAyLCJpYXQiOjE3NzAyOTA1MDIsImp0aSI6IjRmOTRjNmQ3MzAyMzQyOWFiYTg5ZjBkNjUzMGIyOGE5IiwidXNlcl9pZCI6MjA0NDF9.nTL0aqH5iiLZBo_OINQ652tK5fQx74PwTU_cfS2TMzw"'
    echo ""
    echo "Then restart the backend:"
    echo "  docker-compose restart backend"
fi
echo ""

# Step 3: Instructions for getting JWT token
echo "Step 3: Getting your JWT auth token..."
echo ""
echo "Follow these steps to get your JWT token:"
echo ""
echo "  1. Open your browser and go to: http://localhost:3000"
echo "  2. Log in with your account credentials"
echo "  3. Open Developer Tools (press F12)"
echo "  4. Click on the Console tab"
echo "  5. Run this command:"
echo "     console.log(JSON.parse(localStorage.getItem('auth')).access_token)"
echo "  6. Copy the token output"
echo ""
read -p "Have you copied your JWT token? (yes/no): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Paste your JWT token here: " JWT_TOKEN
    export INFLUENCERS_CLUB_TEST_TOKEN="$JWT_TOKEN"
    echo ""
    echo "✅ Token set!"
else
    echo "Skipping API tests..."
    exit 0
fi
echo ""

# Step 4: Test the API
echo "Step 4: Testing API endpoints..."
echo ""

# Test 4a: Credits
echo "Testing: GET /discovery/credits"
CREDITS=$(curl -s -X GET "http://localhost:8000/api/v1/discovery/credits" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if echo "$CREDITS" | grep -q "available_credits"; then
    echo "✅ API is working!"
    echo "   Credits available: $(echo $CREDITS | grep -o '"available_credits":"[^"]*' | cut -d'"' -f4)"
else
    echo "❌ API test failed"
    echo "   Response: $CREDITS"
    exit 1
fi
echo ""

# Step 5: Run the full test suite
echo "Step 5: Ready to run full test suite?"
read -p "Run all tests? (yes/no): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    export INFLUENCERS_CLUB_TEST_TOKEN="$JWT_TOKEN"
    bash /Users/atulkapoor/Documents/C\(AI\)DENCE/test_influencers_club.sh
fi
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  • Visit http://localhost:3000/discovery to see the interface"
echo "  • The discovery page should now show real data from influencers.club"
echo "  • Check the database:"
echo "    docker exec caidence-db-1 psql -U postgres -d caidence_db -c 'SELECT COUNT(*) FROM influencers;'"
