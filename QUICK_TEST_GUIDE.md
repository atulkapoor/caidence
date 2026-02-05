## Quick Testing Guide: Fix Verification

This guide helps you verify that the analytics error has been fixed and the influencers.club integration is ready.

---

## ✅ Part 1: Verify Analytics Page Fix (5 minutes)

### What Was Fixed
- Frontend analytics API calls now include JWT authentication token
- Backend will receive proper authorization headers
- No more "Application error" on analytics page

### How to Test

**Step 1: Open Analytics Page**
```
http://localhost:3000/analytics
```

**Expected:**
- Page loads without error
- Shows 4 KPI cards with data (Total Reach, Engagement Rate, Conversions, ROI)
- Charts render properly
- No red error messages

**If it fails:**
1. Check browser console (F12 → Console tab)
2. Look for errors - they should be gone now
3. Check backend logs: `docker logs caidence-backend-1 | grep analytics`
4. Verify user has `analytics_read` permission in database

---

## ✅ Part 2: Verify Backend Model Fixes (5 minutes)

### What Was Fixed
- Discovery endpoints now correctly reference `Influencer` model
- Helper functions use correct model names
- Database schema aligns with endpoint code

### How to Test

**Step 1: Check imports**
```bash
grep -n "from app.models.creators import" backend/app/api/endpoints/discovery.py
```

Expected output: Shows `Influencer, InfluencerSocialProfile, InfluencerEnrichmentLog`

**Step 2: Check helper functions**
```bash
grep -n "async def _save" backend/app/api/endpoints/discovery.py
```

Expected output: All functions reference `Influencer` model (not `Creator`)

**Step 3: Verify syntax**
```bash
cd backend
python -m py_compile app/api/endpoints/discovery.py
```

Expected: No output (file compiles successfully)

---

## ✅ Part 3: Run Database Setup (10 minutes)

### Step 1: Check if tables exist
```bash
docker exec caidence-db-1 psql -U postgres -d caidence_db -c "\dt influencer*"
```

**If tables exist:** You'll see output like:
```
public | influencers              | table | postgres
public | influencer_social_profiles | table | postgres
...
```

**If tables don't exist:** Run migrations:
```bash
docker exec caidence-backend-1 alembic upgrade head
```

### Step 2: Verify schema
```bash
docker exec caidence-db-1 psql -U postgres -d caidence_db -c "\d influencers"
```

Expected columns:
- id, org_id, name, email, country, city
- total_followers, total_engagement_rate, is_verified
- influencers_club_id, last_enriched_at, raw_data

---

## ✅ Part 4: Get JWT Token (5 minutes)

### Step 1: Open Application
```
http://localhost:3000
```

### Step 2: Log In
Enter your credentials (create account if needed)

### Step 3: Open Developer Tools
Press `F12` on keyboard

### Step 4: Go to Console Tab
Look for the Console tab in developer tools

### Step 5: Get Token
Paste and run:
```javascript
console.log(JSON.parse(localStorage.getItem('auth')).access_token)
```

Expected: Long string starting with `eyJ...`

### Step 6: Copy Token
Right-click and copy the entire token string

---

## ✅ Part 5: Test API Endpoints (15 minutes)

### Setup Environment Variable
```bash
export JWT_TOKEN="paste-your-jwt-token-here"
```

### Test 1: Credits Endpoint
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8000/api/v1/discovery/credits | jq
```

Expected response:
```json
{
  "available_credits": 5000,
  "used_credits": 0,
  "total_credits": 5000
}
```

### Test 2: Keyword Search
```bash
curl -X POST http://localhost:8000/api/v1/discovery/creators/search-keyword \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "keyword": "fitness",
    "limit": 5
  }' | jq
```

Expected: List of Instagram fitness creators

### Test 3: List Discovered Creators
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8000/api/v1/discovery/creators?limit=5 | jq
```

Expected: Paginated list of creators

### Test 4: Statistics
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8000/api/v1/discovery/stats | jq
```

Expected: Aggregate stats like:
```json
{
  "total_creators": 42,
  "avg_followers": 125000,
  "by_platform": {
    "instagram": 20,
    "tiktok": 15,
    ...
  }
}
```

---

## 🎯 Full Test Script (2 minutes)

Run the comprehensive test:
```bash
chmod +x quick_start_influencers_club.sh
./quick_start_influencers_club.sh
```

This will:
1. ✅ Check containers are running
2. ✅ Verify API key configuration  
3. ✅ Guide you to get JWT token
4. ✅ Validate API connectivity
5. ✅ Run 9 full integration tests

---

## ✅ Success Checklist

Mark these off as you complete them:

- [ ] Analytics page loads without error
- [ ] Browser console shows no errors
- [ ] Database tables exist (`\dt influencer*`)
- [ ] JWT token successfully extracted from localStorage
- [ ] API credit endpoint responds with 200 OK
- [ ] Keyword search returns real creator data
- [ ] List endpoint returns paginated results
- [ ] Stats endpoint shows aggregate data
- [ ] All 9 test cases in test script pass

---

## 🔧 Troubleshooting

### Analytics Page Still Shows Error
```bash
# Check backend logs
docker logs caidence-backend-1 -f | grep -i analytics

# Check if user has permission
docker exec caidence-db-1 psql -U postgres -d caidence_db \
  -c "SELECT * FROM user_permissions WHERE permission_name='analytics_read';"
```

### API Endpoints Return 401 Unauthorized
- JWT token may be expired
- Token may be missing from Authorization header
- Backend may not be recognizing the token

Try getting a fresh token and testing again.

### Database Tables Missing
```bash
# Create them with migrations
docker exec caidence-backend-1 alembic upgrade head

# Or check if alembic is configured
docker exec caidence-backend-1 ls -la alembic/
```

### Model References Still Failing
```bash
# Verify fix was applied
grep -n "_save_discovered_creator" backend/app/api/endpoints/discovery.py

# Should show: "creator = Influencer("
# Not: "creator = Creator("
```

---

## 📊 Expected Data Flow

```
Browser (JWT in localStorage)
    ↓
Frontend API Call (with auth header)
    ↓
Backend Endpoint (/api/v1/analytics/dashboard)
    ↓
RBAC Check (require_analytics_read)
    ↓
Database Query
    ↓
Return JSON Response
    ↓
Frontend Renders Dashboard
```

---

## 🎬 What's Next After Verification

Once all tests pass:

1. **Explore Discovery Features**
   - Visit `http://localhost:3000/discovery`
   - Search for creators with filters
   - View enriched profiles

2. **Create Integration Tests**
   - Test all CRUD operations
   - Verify audit logs
   - Monitor credit usage

3. **Production Deployment**
   - Configure prod `INFLUENCERS_CLUB_API_KEY`
   - Run migrations on prod DB
   - Monitor performance

---

**Total Estimated Time: 45 minutes**

Start with Part 1 (Analytics Fix) - should take 5 minutes!
