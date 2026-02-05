## Analytics Page Error - Debugging Guide

**Last Updated:** Feb 5, 2026

The analytics page error "Application error: a client-side exception has occurred" has been further investigated and improved with better error handling and logging.

---

## ✅ Recent Improvements Made

### 1. Enhanced Analytics API (`frontend/src/lib/api/analytics.ts`)
- ✅ Added explicit token check before API call
- ✅ Better error messages with detailed logging
- ✅ Extracted mock data to separate function `getMockAnalyticsData()`
- ✅ All fallbacks return valid data structure

### 2. Improved Analytics Page (`frontend/src/app/analytics/page.tsx`)
- ✅ Added `error` state to track and display errors
- ✅ Better console logging for debugging
- ✅ Error banner displayed when API fails
- ✅ Graceful degradation to mock data on failure
- ✅ Detailed error messages in UI

### 3. New Debug Script (`debug_analytics.sh`)
- ✅ Automated diagnostic tool
- ✅ Tests backend connectivity
- ✅ Validates JWT token
- ✅ Tests analytics endpoint directly
- ✅ Checks permissions
- ✅ Provides actionable next steps

---

## 🚀 Quick Diagnostic Steps (5 minutes)

### Option 1: Use Debug Script (Easiest)
```bash
chmod +x debug_analytics.sh
./debug_analytics.sh
```

Follow the prompts to:
1. Verify backend is running
2. Get your JWT token
3. Test the analytics endpoint directly
4. Check permissions

### Option 2: Manual Debugging

**Step 1: Check browser console**
```
1. Open http://localhost:3000/analytics
2. Press F12 to open Developer Tools
3. Click "Console" tab
4. Look for error messages - they will be detailed now
5. Take a screenshot of any red errors
```

**Step 2: Test API directly**
```bash
# Get your token from browser console first:
# localStorage.getItem('token')

curl -X GET "http://localhost:8000/api/v1/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Step 3: Check backend logs**
```bash
docker logs caidence-backend-1 -f | grep -E "analytics|error"
```

---

## 🔍 Common Error Scenarios & Solutions

### Scenario 1: "401 Unauthorized"
**Error:** Token is invalid or expired
**Solution:**
```bash
# Log out and back in:
1. Visit http://localhost:3000/login
2. Enter credentials again
3. Get new token: localStorage.getItem('token')
4. Try analytics page again
```

### Scenario 2: "403 Forbidden"
**Error:** User lacks `analytics_read` permission
**Solution:**
```bash
# Grant permission via database:
docker exec caidence-db-1 psql -U postgres -d caidence_db -c "
INSERT INTO user_permissions (user_id, permission_id) 
VALUES ((SELECT id FROM users LIMIT 1), (SELECT id FROM permissions WHERE name='analytics_read'))
ON CONFLICT DO NOTHING;
"

# Or reset admin:
cd backend
python reset_admin_password.py
```

### Scenario 3: "500 Server Error"
**Error:** Backend issue processing request
**Solution:**
```bash
# Check backend health:
docker logs caidence-backend-1 --tail=100

# Restart backend if needed:
docker-compose restart backend

# Wait for startup:
sleep 5

# Test endpoint again
```

### Scenario 4: Browser Shows Mock Data
**This is EXPECTED behavior!**
- If API fails, you see demo data
- Check browser console for error details (yellow warning boxes)
- The error banner should show what went wrong
- Data still displays so users aren't blocked

---

## 📊 API Response Structure

### Success (200):
```json
{
  "overview": {
    "total_reach": 1250000,
    "engagement_rate": 4.2,
    "conversions": 892,
    "roi": 3.8
  },
  "trends": [
    { "date": "Jan", "value": 4000, "engagement": 2400 },
    ...
  ],
  "audience": [
    { "name": "Mobile", "value": 52 },
    ...
  ]
}
```

### What Frontend Expects:
- `overview`: Object with `total_reach`, `engagement_rate`, `conversions`, `roi` (all numbers)
- `trends`: Array of objects with `date`, `value`, `engagement` (all numbers)
- `audience`: Array of objects with `name` (string), `value` (number)

---

## 🔧 Token Debugging

### Check if token exists:
```javascript
// In browser console:
console.log("Token:", localStorage.getItem('token'));
console.log("User:", localStorage.getItem('user'));
```

### Check token validity:
```bash
# Decode JWT token (online): https://jwt.io/
# Paste your token there to see expiration

# Or check via API:
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚨 Troubleshooting Flowchart

```
Analytics page shows error?
│
├─→ Can you see in browser console? (F12)
│   ├─→ YES: Search solution for that specific error
│   └─→ NO: (Rare) May be a rendering issue
│
├─→ Check backend logs: docker logs caidence-backend-1
│   ├─→ 401 Error: Token issue
│   ├─→ 403 Error: Permission issue
│   ├─→ 500 Error: Server error
│   └─→ No error: Network issue
│
├─→ Test API directly with curl
│   ├─→ Returns data: Frontend issue
│   ├─→ 401: Auth issue
│   ├─→ 403: Permission issue
│   └─→ 500: Backend error
│
└─→ Run debug script: ./debug_analytics.sh
    └─→ Follow recommendations
```

---

## 📋 Pre-Flight Checklist

Before declaring the issue "fixed", verify:

- [ ] Backend container running: `docker ps | grep backend`
- [ ] Frontend loads: `http://localhost:3000`
- [ ] Can log in successfully
- [ ] Token exists: `localStorage.getItem('token')` returns a string
- [ ] Curl test succeeds (200 status, JSON response)
- [ ] Browser console has no red errors (warnings are OK)
- [ ] Analytics page loads (even if showing demo data)
- [ ] Error banner visible if API fails

---

## 📈 What to Look for in Logs

### Backend logs should show:
```
INFO: GET /api/v1/analytics/dashboard
INFO: User 123 has analytics_read permission
INFO: Fetching analytics data from database
INFO: Analytics response: {...}
```

### Frontend logs (console) should show:
```
Loading analytics dashboard...
Analytics loaded: {...objects...}
```

---

## 🎯 Next Steps

1. **Run the debug script:**
   ```bash
   chmod +x debug_analytics.sh
   ./debug_analytics.sh
   ```

2. **Share output** if still having issues:
   - Screenshot of browser console error
   - Output from debug script
   - Backend logs from `docker logs caidence-backend-1`

3. **Try these quick fixes:**
   ```bash
   # Clear cache and refresh
   Ctrl+Shift+Del (Clear browsing data)
   
   # Refresh page
   F5
   
   # Restart backend if modified
   docker-compose restart backend
   ```

---

## 🔄 Recent Code Changes

### Files Modified:
1. **frontend/src/lib/api/analytics.ts**
   - Added `getMockAnalyticsData()` helper function
   - Better error handling and logging
   - Token validation before API call

2. **frontend/src/app/analytics/page.tsx**
   - Added `error` state tracking
   - Error banner display when API fails
   - Detailed console logging
   - Still displays data on error (graceful degradation)

3. **debug_analytics.sh** (NEW)
   - Interactive debugging tool
   - Tests all components
   - Provides specific solutions

---

## ✅ Expected Behavior

### Best Case:
- Page loads with real data from API
- Charts and metrics display correctly
- No errors in console

### Acceptable Case:
- Page loads with demo/mock data
- Yellow error banner explains API issue
- Charts still display and are interactive
- User can continue using the app

### Unacceptable Case:
- Blank page / no content
- Red JavaScript error in console
- Page not loading at all

---

## 🆘 If Still Having Issues

1. **Collect diagnostic info:**
   ```bash
   # Run debug script and save output
   ./debug_analytics.sh > debug_output.txt 2>&1
   
   # Get backend logs
   docker logs caidence-backend-1 --tail=200 > backend_logs.txt
   ```

2. **Get browser console screenshot:**
   - Press F12
   - Right-click console and select "Clear to clipboard"
   - Paste into a text file

3. **Check if token is being sent:**
   - Open DevTools Network tab
   - Refresh page
   - Find request to `/api/v1/analytics/dashboard`
   - Check Request Headers → Authorization header

4. **Verify database has data:**
   ```bash
   docker exec caidence-db-1 psql -U postgres -d caidence_db -c \
     "SELECT COUNT(*) FROM campaign_analytics;"
   ```

---

**Note:** This error should now show detailed messages in the browser console and error banner, making it much easier to diagnose the root cause.
