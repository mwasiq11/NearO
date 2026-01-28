# Rate Limiting Configuration

## Overview
The rate limiting has been significantly increased to handle normal application traffic and prevent false-positive 429 errors during regular usage.

## Changes Made

### 1. Global Rate Limit
**Before:** 100 requests per 15 minutes  
**After:** 500 requests per 15 minutes

**Configuration:**
- Uses user ID for authenticated requests (per-user limit)
- Uses IP address for unauthenticated requests
- Excludes `/health` and `/uploads/*` paths automatically

### 2. Authentication Rate Limit
**Before:** 5 requests per hour  
**After:** 10 requests per hour

**Applies to:**
- `/auth/register`
- `/auth/login`
- `/auth/refresh-token`

### 3. Search Rate Limit
**Before:** 50 requests per hour  
**After:** 200 requests per hour

**Applies to:**
- `/search/services`
- `/search/nearby`
- `/search/categories`
- `/search/neighborhoods`
- `/search/cities`

**Special Rules:**
- Authenticated GET requests skip rate limiting
- Allows unlimited browsing for logged-in users

### 4. Password Reset Rate Limit
**Before:** 3 requests per hour  
**After:** 5 requests per hour

**Applies to:**
- `/auth/forgot-password`
- `/auth/reset-password`

### 5. Email Verification Rate Limit
**Before:** 5 requests per hour  
**After:** 10 requests per hour

**Applies to:**
- `/auth/verify-email`
- `/auth/resend-verification`

### 6. NEW: Read-Only Rate Limit
**Added:** 100 requests per minute for GET requests

**Purpose:**
- High-frequency limit for read operations
- Prevents abuse while allowing normal browsing
- Auto-applied to all GET endpoints except those already covered

## Environment Variables

Updated `.env` defaults:
```env
RATE_LIMIT_MAX_REQUESTS=500           # Global limit (15 min window)
RATE_LIMIT_WINDOW_MS=900000           # 15 minutes

AUTH_RATE_LIMIT_MAX=10                # Auth limit (1 hour window)
AUTH_RATE_LIMIT_WINDOW_MS=3600000     # 1 hour

SEARCH_RATE_LIMIT_MAX=200             # Search limit (1 hour window)
SEARCH_RATE_LIMIT_WINDOW_MS=3600000   # 1 hour
```

## Exemptions

### Automatic Exemptions
1. **Static Files:** `/uploads/*` - no rate limiting
2. **Health Check:** `/health` - no rate limiting
3. **Authenticated GET Requests:** Skip search limiter for browsing

### Manual Exemptions in Code
If you need to exempt additional paths:
```javascript
// In rateLimit.js globalLimiter
skip: (req) => {
  return req.path === '/your-path' || 
         req.path.startsWith('/your-prefix/');
}
```

## Request Flow

```
Incoming Request
     ↓
Is /health or /uploads? → YES → Skip all limits
     ↓ NO
Global Limiter (500/15min)
     ↓
Route-Specific Limiter
     ↓ 
- Auth routes: 10/hr
- Search routes: 200/hr (skip if authenticated GET)
- Password reset: 5/hr
- Email verify: 10/hr
- Read-only: 100/min for GET
     ↓
Controller
```

## Monitoring

### Check Rate Limit Headers
Every response includes headers:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 485
X-RateLimit-Reset: 1635789600000
Retry-After: 900 (on 429 errors)
```

### Log Rate Limit Hits
When a request is rate limited:
```javascript
console.log(`Rate limit exceeded for ${req.ip}`);
```

## How to Apply Changes

### 1. Backend Restart Required
```bash
cd backend
npm start
```

### 2. Verify Changes
```bash
# Check health endpoint (should work without limits)
curl http://localhost:3000/health

# Check services endpoint
curl http://localhost:3000/services
```

### 3. Test Different Scenarios
```bash
# Test authenticated requests (should have higher limits)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/services

# Test search (200/hr limit)
curl http://localhost:3000/search/categories
```

## Troubleshooting

### Still Getting 429 Errors?

1. **Check Redis Connection**
   - Rate limiting uses Redis for distributed limits
   - Verify Redis is running: `redis-cli ping`

2. **Clear Rate Limit Cache**
   ```bash
   redis-cli FLUSHDB
   ```

3. **Increase Limits Further**
   - Edit `backend/src/middleware/rateLimit.js`
   - Increase `MAX_REQUESTS`, `AUTH_MAX`, or `SEARCH_MAX`
   - Restart backend

4. **Disable Rate Limiting (Development Only)**
   ```javascript
   // In app.js, comment out:
   // app.use(globalLimiter);
   ```

### Common Issues

**Issue:** Frontend makes 20+ parallel requests on page load  
**Solution:** ✅ Global limit increased to 500, should handle burst traffic

**Issue:** Authenticated users hit search limits quickly  
**Solution:** ✅ Authenticated GET requests skip search limiter

**Issue:** Development reloads trigger rate limits  
**Solution:** ✅ Per-user limits instead of IP-based for authenticated requests

**Issue:** Static assets counted toward limits  
**Solution:** ✅ `/uploads/*` automatically exempted

## Best Practices

### For Development
- Use authenticated requests to get higher limits
- Clear Redis cache between tests if needed
- Consider disabling rate limiting locally

### For Production
- Monitor rate limit headers in browser DevTools
- Implement exponential backoff on 429 responses
- Use pagination to reduce request frequency
- Cache data in frontend to minimize API calls

### Frontend Implementation
```typescript
// Example: Retry with exponential backoff
const fetchWithRetry = async (url: string, retries = 3) => {
  try {
    const response = await fetch(url);
    if (response.status === 429 && retries > 0) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => 
        setTimeout(resolve, (retryAfter || 1) * 1000)
      );
      return fetchWithRetry(url, retries - 1);
    }
    return response;
  } catch (error) {
    throw error;
  }
};
```

## Summary

✅ **Completed:**
- Global limit increased 5x (100 → 500 requests/15min)
- Auth limit doubled (5 → 10 requests/hr)
- Search limit increased 4x (50 → 200 requests/hr)
- Added read-only limiter (100 requests/min)
- Exempted static files and health checks
- Smart skipping for authenticated users
- Per-user limits for authenticated requests

🎯 **Result:**
- Normal application usage should not trigger 429 errors
- Authenticated users get higher effective limits
- Protection against abuse still maintained
- Better user experience during browsing

⚠️ **Action Required:**
**Restart the backend server for changes to take effect!**
```bash
cd backend
npm start
```
