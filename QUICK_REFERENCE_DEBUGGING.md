# Quick Reference - Commands & Debugging

## 🚀 Starting the Application

### Start Backend
```bash
cd f:\NearO\backend
npm start
```
**Expected Output**:
```
🚀 Stage 3 Backend running on http://localhost:3000
✅ MySQL database initialized successfully
✅ Redis connected successfully
✅ Notification worker started
```

### Start Frontend
```bash
cd f:\NearO\frontend
npm run dev
```
**Expected Output**:
```
VITE v5.4.19 ready in XXXX ms
➜ Local: http://localhost:8080/
```

## 🔍 Testing Commands

### Check if Backend is Running
```bash
curl http://localhost:3000/health
```

### Check if Frontend is Running
```bash
curl http://localhost:8080
```

### Kill All Node Processes
```bash
Get-Process -Name node | Stop-Process -Force
```

## 📋 File Locations (Important)

### Backend Files Modified
- `backend/src/controllers/bookings.js` - Accept/reject functions, Socket.io emit
- `backend/src/controllers/notificationsController.js` - Safety checks, 401 handling
- `backend/src/realtime/socket.js` - getIO() export, io instance storage

### Frontend Files Modified
- `frontend/src/store/slices/notificationsSlice.ts` - UUID type fixes
- `frontend/src/components/common/NotificationDropdown.tsx` - Socket listener

### Configuration Files
- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables (if exists)

## 🔧 Testing in Browser Console

### Check Socket.io Connection
```javascript
// In browser console
const socket = getSocket();
console.log('Connected:', socket.connected);
console.log('ID:', socket.id);
```

### Manually Listen for Booking Event
```javascript
// In browser console
const socket = getSocket();
socket.on('booking:status-changed', (data) => {
  console.log('Booking status changed:', data);
});
```

### Manually Fetch Notifications
```javascript
// In browser console (requires Redux)
store.dispatch(fetchNotifications(false));
store.dispatch(fetchUnreadCount());
```

## 📱 Simulating Errors for Testing

### Simulate 401 Error
```bash
# Terminal - Make request without auth token
curl http://localhost:3000/notifications
# Should return: {"error": "..."}
```

### Simulate 500 Error
```bash
# Terminal - Make invalid request
curl -X PUT http://localhost:3000/bookings/invalid-id/accept \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"
```

## 🐛 Debugging Browser Issues

### Clear Browser Cache & Restart
```
1. Press F12 to open DevTools
2. Click Settings (gear icon)
3. Check "Disable cache (while DevTools is open)"
4. Press Ctrl+Shift+Delete to clear cache
5. Close and reopen browser
```

### Check Socket.io Events
```javascript
// In browser console
const socket = getSocket();
// Monitor all events
socket.onAny((eventName, ...args) => {
  console.log('Socket event:', eventName, args);
});
```

### Check API Requests
```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter for XHR/Fetch
4. Look for PUT requests to /bookings/*/accept
5. Check response headers and body
```

## 🔐 JWT Token Debugging

### Decode JWT Token in Console
```javascript
// In browser console
const token = localStorage.getItem('accessToken');
console.log('Token:', token);

// Decode (if you have the jwt-decode library)
const decoded = jwt_decode(token);
console.log('Decoded:', decoded);
```

### Check Token in API Request
```javascript
// In browser console
const api = require('@/lib/api');
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json'
};
console.log('Headers:', headers);
```

## 📊 Database Debugging

### Check Notifications in MySQL
```sql
SELECT id, user_id, type, title, message, is_read, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Bookings in MySQL
```sql
SELECT id, service_id, seeker_id, status, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check User Presence (Online Status)
```sql
SELECT user_id, status, socket_id, last_seen 
FROM user_presence 
WHERE status = 'online';
```

## 🔄 Common Troubleshooting Steps

### If Accept/Reject Returns 401
1. Verify you're logged in as the provider
2. Check that the service belongs to your account
3. Check token is being sent in Authorization header
4. Restart backend: `npm start`
5. Clear browser cache and refresh

### If Real-Time Notification Doesn't Show
1. Check Socket.io connection: `socket.connected === true`
2. Check browser console for "📢 Received booking status change event"
3. Verify notification was created in database
4. Try closing and reopening notification dropdown
5. Try page refresh
6. Check network connection to localhost:3000

### If Unread Count Doesn't Update
1. Manually refresh unread count: `dispatch(fetchUnreadCount())`
2. Check `/notifications/unread-count` endpoint returns correct count
3. Verify user is authenticated with correct token
4. Check database has notification records with correct user_id
5. Restart frontend: `npm run dev`

### If Types Don't Match
1. Verify all IDs are strings (UUIDs) not numbers
2. Check TypeScript types in notificationsSlice.ts
3. Ensure backend sends string IDs in JSON response
4. Run TypeScript check: `npm run type-check` (if available)
5. Clear node_modules and reinstall: `npm install`

## 📈 Performance Monitoring

### Check Backend Memory Usage
```bash
# In backend terminal, Ctrl+C shows stats
# Look for memory usage and event listener counts
```

### Check Frontend Bundle Size
```bash
cd frontend
npm run build
# Check dist/ folder size
```

### Monitor Socket.io Connections
```javascript
// In Node.js console (backend)
const io = getIO();
console.log('Connected clients:', io.engine.clientsCount);
console.log('Rooms:', io.sockets.adapter.rooms);
```

## 🎯 Success Indicators

All these should be visible/working:
- ✅ Bell icon shows badge with number
- ✅ Clicking bell shows notifications dropdown
- ✅ New notifications appear without page refresh
- ✅ Notification has correct title and message
- ✅ Console shows "📢 Received booking status change event"
- ✅ No errors in browser console
- ✅ No errors in backend console
- ✅ Bookings appear in "My Bookings" with correct status
- ✅ Socket.io connection shows connected

## 📞 Support

If you encounter issues:
1. Check the TESTING_BOOKING_FLOW.md for step-by-step guide
2. Check SESSION_SUMMARY_BOOKING_FIX.md for technical details
3. Check IMPLEMENTATION_CHECKLIST.md for all changes made
4. Use debugging commands above to diagnose the issue
5. Check browser console for JavaScript errors
6. Check backend console for server errors
