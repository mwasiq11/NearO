# Testing Booking Accept/Reject & Real-Time Notifications

## ✅ What Was Fixed

1. **Backend Authentication** - Added `req.user?.id` safety checks to prevent 401/500 errors
2. **Type Alignment** - Fixed UUID type mismatches (string instead of number) between frontend and backend
3. **Notification Creation** - Ensured notifications are created when booking is accepted/rejected
4. **Real-Time Broadcasting** - Added Socket.io event emission for instant seeker notification
5. **Frontend Listener** - Added Socket.io event listener to refresh notifications when booking status changes

## 🧪 Test Scenario

### Step 1: Open Two Browser Windows
- **Window 1**: Seeker account (account that wants to book)
- **Window 2**: Provider account (account that provides the service)
- Keep both logged in and visible

### Step 2: Create a Booking (in Window 1 - Seeker)
1. Find any service listed by a different user
2. Click the "Book Service" button
3. Fill in the booking details
4. Submit the booking request
5. **Expected**: Booking appears in "My Bookings" with status "pending"

### Step 3: Accept Booking (in Window 2 - Provider)
1. Go to Provider Dashboard or My Bookings
2. Find the pending booking from Step 2
3. Click the "Accept" button
4. **Expected in Window 2**: "Booking accepted" success message in console

### Step 4: Verify Real-Time Notification (in Window 1 - Seeker)
1. Look at the Bell Icon in top navigation
2. **Expected**: Badge shows "1" unread notification
3. Click the Bell Icon to open dropdown
4. **Expected**: See notification titled "Booking Accepted" with message "Your booking has been accepted by the provider"
5. **Expected in Browser Console**: See message: "📢 Received booking status change event: ..."

### Step 5: Test Reject (Repeat with Different Service)
1. Create another booking in Window 1
2. In Window 2, click "Reject" instead of "Accept"
3. **Expected**: Window 1 shows "Booking Declined" notification in dropdown
4. Booking status changes to "rejected"

## 🔍 What to Check in Browser Console

### Window 1 (Seeker)
```
📢 Received booking status change event: {...}
```

### Window 2 (Provider)
```
[ACCEPT] Provider ID: xxx, Current User: xxx
✅ Booking xxx updated to approved
✅ Notification xxx created for seeker yyy
📡 Socket.io event emitted for booking status change
```

## 🔍 What to Check in Server Console

```
[ACCEPT] Provider ID: <provider-uuid>, Current User: <provider-uuid>
✅ Booking <booking-uuid> updated to approved
✅ Notification <notif-uuid> created for seeker <seeker-uuid>
📡 Socket.io event emitted for booking status change
```

## 🛠️ Debugging Tips

### If notifications don't appear:
1. Open browser DevTools (F12) → Console tab
2. Check for JavaScript errors
3. Verify Socket.io connection: `getSocket()` should show connected socket
4. Check Network tab → WS (WebSocket) connection to localhost:3000

### If clicking "Accept" shows error:
1. Check browser console for errors
2. Check Network tab → look for PUT request to `/bookings/:id/accept`
3. Verify you're logged in as the provider
4. Check that booking belongs to your service

### If unread count doesn't update:
1. Manually refresh the page (Ctrl+R)
2. Check that `/notifications/unread-count` endpoint returns correct count
3. Verify you're logged in with correct user

## 📋 Expected API Flow

### Accept Booking:
```
PUT /bookings/{id}/accept
↓
Backend Updates: bookings.status = 'approved'
↓
Backend Creates: notification for seeker
↓
Backend Emits: Socket.io 'booking:status-changed' event
↓
Frontend Receives: Socket event
↓
Frontend Calls: fetchNotifications() & fetchUnreadCount()
↓
Seeker Sees: Notification in dropdown + badge count
```

## ✨ Key Features Working

- ✅ JWT Authentication (token sent in Authorization header)
- ✅ Provider verification (only provider can accept/reject)
- ✅ Notification creation in database
- ✅ Real-time Socket.io broadcast
- ✅ Frontend Socket listener
- ✅ Redux state update for notifications
- ✅ Unread count badge update
- ✅ Type safety (all IDs are strings/UUIDs)

## 🎯 Success Criteria

All of the following should work:
1. ✅ Accept button works without errors
2. ✅ Reject button works without errors
3. ✅ Seeker sees notification immediately (real-time)
4. ✅ Notification has correct title and message
5. ✅ Unread count badge updates
6. ✅ No 401 or 500 errors in console
7. ✅ Booking status updates in database
