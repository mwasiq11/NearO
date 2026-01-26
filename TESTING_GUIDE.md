# Testing Guide After Bug Fixes

## Quick Test Commands

### 1. Test Service Creation (Frontend)
Try creating a service with this data:
```json
{
  "provider_id": "your-user-id",
  "title": "gym trainer",
  "description": "this service is for gym training",
  "category": "Other",
  "price": 4566,
  "availability": "#gym #trainer",
  "latitude": 34323,
  "longitude": 32432,
  "neighborhood": "gulshan",
  "city": "karachi"
}
```
**Expected**: ✅ Service created successfully

---

### 2. Test Trending Services
**Browser**: http://localhost:3000/discover/trending

**Or with curl**:
```bash
curl http://localhost:3000/discover/trending
```

**Expected**: ✅ JSON response with services array

---

### 3. Test Email Verification
1. Sign up new account
2. Check email inbox
3. Click "Verify Email Address" button
4. **Expected**: Opens `http://localhost:8080/verify-email?token=...` (not 3000!)

---

### 4. Test Audit Logging

#### Signup Audit Log
1. Sign up new user
2. Run MySQL query:
```sql
SELECT 
  actor_id,
  action_type,
  JSON_EXTRACT(metadata, '$.name') as name,
  JSON_EXTRACT(metadata, '$.email') as email,
  JSON_EXTRACT(metadata, '$.role') as role,
  ip_address,
  user_agent,
  created_at
FROM audit_logs
WHERE action_type = 'user_signup'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Output**:
```
| actor_id | action_type | name          | email              | role   | ip_address | user_agent       | created_at          |
|----------|-------------|---------------|--------------------| -------|------------|------------------|---------------------|
| uuid     | user_signup | "John Doe"    | "john@example.com" | "user" | 127.0.0.1  | Mozilla/5.0...   | 2026-01-26 10:30:00 |
```

#### Login Audit Log
1. Login with user account
2. Run MySQL query:
```sql
SELECT 
  actor_id,
  action_type,
  JSON_EXTRACT(metadata, '$.name') as name,
  JSON_EXTRACT(metadata, '$.email') as email,
  ip_address,
  created_at
FROM audit_logs
WHERE action_type IN ('user_login', 'moderator_login', 'admin_login')
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Output**:
```
| actor_id | action_type  | name          | email              | ip_address | created_at          |
|----------|--------------|---------------|--------------------| -----------|---------------------|
| uuid     | user_login   | "John Doe"    | "john@example.com" | 127.0.0.1  | 2026-01-26 10:35:00 |
```

---

## Database Verification Queries

### Check All Recent Activity
```sql
SELECT 
  id,
  actor_id,
  action_type,
  entity_type,
  metadata,
  ip_address,
  LEFT(user_agent, 50) as user_agent_preview,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Count Logs by Type
```sql
SELECT 
  action_type,
  COUNT(*) as total
FROM audit_logs
GROUP BY action_type
ORDER BY total DESC;
```

### Find Specific User's Activity
```sql
SELECT 
  action_type,
  entity_type,
  created_at
FROM audit_logs
WHERE actor_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

---

## Frontend Console Checks

After restarting backend, the React Router warnings are normal:
```
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7...
```
These are just warnings, not errors. You can ignore them or add flags to suppress.

---

## What Should Work Now

✅ **Service Creation**: Any availability string accepted (including "#gym #trainer")  
✅ **Location**: Optional lat/lng fields, no strict validation  
✅ **Trending Services**: No more 500 errors  
✅ **Email Links**: All point to http://localhost:8080  
✅ **Audit Logging**: Every signup/login tracked with:
  - User name & email
  - IP address
  - Browser info (user agent)
  - Timestamp
  - Complete metadata

---

## Backend Restart

The backend will auto-restart via nodemon. Look for:
```
🚀 Stage 3 Backend running on http://localhost:3000
✅ Database initialized successfully
```

If you see these, you're ready to test!

---

## Need to Reset Database?

If you want to clear audit logs for testing:
```sql
TRUNCATE TABLE audit_logs;
```

---

## Environment Variables Set

In `backend/.env`:
```env
FRONTEND_URL=http://localhost:8080
```

This ensures all email links point to frontend, not backend.

---

## Next Steps

1. Test service creation from frontend
2. Test user signup → Check email → Click verification link
3. Test login → Check audit_logs table
4. View history page → Should show signup and login entries

All systems ready! 🚀
