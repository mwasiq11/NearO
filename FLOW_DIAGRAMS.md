# Visual Flow Diagrams - Booking Accept/Reject with Real-Time Notifications

## 🔄 Complete Booking Accept Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BOOKING ACCEPT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: SEEKER CREATES BOOKING
┌──────────────────┐
│   Seeker (App)   │
│ Clicks "Book"    │
│ Fills form       │
│ Submits          │
└────────┬─────────┘
         │ POST /bookings
         │ { service_id, seeker_id, requested_time }
         ▼
┌──────────────────────────────────────────┐
│            Backend API Server            │
│   bookings.js::createBooking()           │
│   - Validates input                      │
│   - Creates booking record               │
│   - Status = 'pending'                   │
│   - Returns booking ID                   │
└────────┬─────────────────────────────────┘
         │ Returns { success, booking }
         ▼
┌──────────────────┐
│ Seeker (App)     │
│ Booking created! │
│ Waiting...       │
└──────────────────┘


STEP 2: PROVIDER ACCEPTS BOOKING
┌──────────────────┐
│   Provider (App) │
│ Sees pending     │
│ Clicks "Accept"  │
└────────┬─────────┘
         │ PUT /bookings/{id}/accept
         │ Authorization: Bearer {token}
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Backend API Server                             │
│            bookings.js::acceptBooking()                          │
│                                                                  │
│ 1. ✅ Verify user is authenticated (req.user?.id check)         │
│ 2. ✅ Fetch booking and verify provider ownership               │
│ 3. ✅ Update booking status = 'approved'                        │
│    UPDATE bookings SET status = 'approved'                      │
│                                                                  │
│ 4. ✅ Create notification for seeker                            │
│    INSERT INTO notifications                                    │
│    (id, user_id, type, title, message)                          │
│    VALUES (uuid, seeker_id, 'booking_accepted',                 │
│           'Booking Accepted',                                   │
│           'Your booking has been accepted by provider')         │
│                                                                  │
│ 5. ✅ EMIT Socket.io EVENT (NEW!)                               │
│    io.emit('booking:status-changed', {                          │
│      bookingId: id,                                             │
│      status: 'approved',                                        │
│      seekerId: booking.seeker_id,                               │
│      notification: {...}                                        │
│    })                                                           │
│                                                                  │
│ Console Output:                                                  │
│ [ACCEPT] Provider ID: xxx, Current User: xxx                    │
│ ✅ Booking xxx updated to approved                              │
│ ✅ Notification xxx created for seeker yyy                      │
│ 📡 Socket.io event emitted for booking status change            │
└──────────┬───────────────────────────────────────────────────────┘
           │ { success: true, message: 'Booking accepted' }
           ▼
┌──────────────────────────────────────────┐
│    Provider Browser                      │
│  ✅ Success message shown                │
│  ✅ Booking status changes to approved   │
│  ✅ Console shows success                │
└──────────────────────────────────────────┘


STEP 3: SEEKER RECEIVES REAL-TIME NOTIFICATION
┌────────────────────────────────────────────────────────────────┐
│                   Socket.io Real-Time Connection               │
│   (Connected at browser load)                                  │
└────────────────────────────────────────────────────────────────┘
                              │
        Backend broadcasts: 'booking:status-changed'
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
      Provider Browser           Seeker Browser
      (ignores event)     (RECEIVES EVENT!)
                                 │
                                 ▼
                    ┌──────────────────────────────┐
                    │ NotificationDropdown.tsx     │
                    │ handleBookingStatusChanged() │
                    │                              │
                    │ dispatch(fetchNotifications) │
                    │ dispatch(fetchUnreadCount)   │
                    └──────────┬───────────────────┘
                               │
                    Console Output:
                    📢 Received booking status changed: {...}
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │ Redux State Updates          │
                    │ - Add notification to array  │
                    │ - Increment unreadCount      │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │   UI Updates Automatically   │
                    │ - Bell icon shows badge "1"  │
                    │ - Notification appears in    │
                    │   dropdown with:             │
                    │   ✓ Title: "Booking Accepted"│
                    │   ✓ Message: "Your booking   │
                    │     has been accepted..."    │
                    │   ✓ Icon: Green checkmark    │
                    │   ✓ Timestamp: "just now"    │
                    └──────────────────────────────┘

┌──────────────────────────────────────────┐
│      Seeker Browser NOW Shows:           │
│                                          │
│  🔔 (Bell icon with 1 badge)             │
│                                          │
│  Notification Dropdown:                  │
│  ┌──────────────────────────────────┐   │
│  │ 🟢 Booking Accepted              │   │
│  │ Your booking has been accepted    │   │
│  │ by the provider                   │   │
│  │ just now                          │   │
│  │ (blue dot = unread)               │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Booking Status: "approved"              │
│  (in My Bookings page)                   │
└──────────────────────────────────────────┘

RESULT: ✅ SEEKER SEES UPDATE IMMEDIATELY (NO REFRESH NEEDED!)
```

---

## 🔄 Reject Booking Flow (Similar to Accept)

```
Provider clicks "Reject"
        │
        ▼
   PUT /bookings/{id}/reject
        │
        ▼
Backend:
- Verify provider
- Update status = 'rejected'
- Create notification (type: 'booking_rejected')
- Emit Socket.io: 'booking:status-changed' with status: 'rejected'
        │
        ▼
Seeker receives Socket.io event
        │
        ▼
Notification appears:
┌───────────────────────────────────────┐
│ 🕐 Booking Declined                   │
│ Your booking has been declined        │
│ by the provider                       │
│ just now                              │
└───────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                          │
│                    (React + TypeScript)                      │
└─────────────────────────────────────────────────────────────┘
              │                                    │
              │ HTTP REST API                      │ WebSocket (Socket.io)
              │ (Accept/Reject)                    │ (Real-time events)
              │                                    │
┌─────────────▼────────────────────────────────────▼──────────┐
│                     EXPRESS.JS BACKEND                        │
│                  (Node.js + TypeScript)                      │
│                                                               │
│  Routes:                                                      │
│  PUT /bookings/{id}/accept  ──┐                              │
│  PUT /bookings/{id}/reject  ──┤                              │
│  GET /notifications         ──┤                              │
│  POST /notifications/{id}/read ┤                             │
│                                │                             │
│  Controllers:                  │                             │
│  bookings.js ◄─────────────────┤                             │
│  notificationsController.js ◄──┤                             │
│                                │                             │
│  Services:                     │                             │
│  Socket.io (io.emit) ◄─────────┘                             │
│                                                               │
│  Middleware:                                                  │
│  auth.js (JWT verification)                                  │
│  permissions.js (Provider check)                             │
└──────────┬───────────────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐   ┌──────────┐
│ MySQL  │   │  Redis   │
│        │   │          │
│Bookings│   │Caching   │
│Notifs  │   │Queues    │
│Users   │   │Sessions  │
└────────┘   └──────────┘
```

---

## 📡 Real-Time Communication (Socket.io)

```
┌─────────────────────────────────────────────────────────┐
│              SOCKET.IO CONNECTION                        │
│         (Established on Browser Load)                    │
└─────────────────────────────────────────────────────────┘

CLIENT SIDE (Frontend):
┌─────────────────────────────────────┐
│ import { getSocket } from socket.ts │
│ socket = io('localhost:3000')        │
│ socket.auth = { token }              │
│ socket.connect()                     │
│                                      │
│ Listening for:                       │
│ socket.on('booking:status-changed')  │
│ socket.on('message:received')        │
│ socket.on('user:status')             │
└─────────────────────────────────────┘
              │
              │ Persistent WebSocket Connection
              │
┌─────────────────────────────────────┐
│  SERVER SIDE (Backend)              │
│  socket.io Server                    │
│                                      │
│  Authenticated by JWT token          │
│  User: { id, email, role }          │
│                                      │
│  Broadcasting:                       │
│  io.emit('booking:status-changed')   │
│  socket.emit('message:received')     │
│  io.emit('user:status')              │
└─────────────────────────────────────┘

FLOW:
1. Browser loads → Socket.io connects to backend
2. User authenticates → Socket linked to user ID
3. Backend creates notification → io.emit() event
4. Frontend receives event → RefreshNotifications()
5. UI updates → User sees notification immediately
```

---

## 🔐 Authentication Flow

```
USER LOGIN
    │
    ▼
┌────────────────────────────┐
│  POST /auth/login          │
│  { email, password }       │
└────────────┬───────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Backend validates  │
    │ email & password   │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Generate JWT token         │
    │ Header: user ID, email     │
    │ Signature: Secret key      │
    └────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Browser stores token in localStorage       │
│ accessToken = "eyJhbGci..."                │
└────────┬───────────────────────────────────┘
         │
         │ Every API request includes token:
         │ Authorization: Bearer {token}
         │
         ▼
┌────────────────────────────────────────────┐
│ Backend middleware verifies token          │
│ auth.js::authenticate()                    │
│                                            │
│ 1. Extract token from header               │
│ 2. Verify signature with secret key        │
│ 3. Decode and extract user info            │
│ 4. Set req.user = { id, email, role }     │
│ 5. Allow request to proceed                │
└────────────────────────────────────────────┘

SOCKET.IO CONNECTION also uses token:
io(url, {
  auth: { token: accessToken }
})
```

---

## 🧪 Error Handling Flow

```
REQUEST WITH MISSING/INVALID TOKEN

PUT /bookings/{id}/accept (no Authorization header)
        │
        ▼
┌─────────────────────────────┐
│ Backend middleware          │
│ auth.js::authenticate()     │
└────────┬────────────────────┘
         │
         ├─ No token found? ──► 401 Unauthorized
         │
         ├─ Invalid signature? ──► 401 Unauthorized
         │
         └─ Token expired? ──► 401 Unauthorized
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Response: 401 Unauthorized          │
         │ {                                   │
         │   "error": "Invalid or missing token"│
         │ }                                   │
         └──────────┬────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────────────────────┐
         │ Browser catches 401                 │
         │ Redirects to login page             │
         │ Clears localStorage token          │
         └─────────────────────────────────────┘


REQUEST FROM NON-PROVIDER

PUT /bookings/{id}/accept (as seeker, not provider)
        │
        ▼
┌──────────────────────────────┐
│ Backend bookings.js          │
│ - Verifies token ✓           │
│ - Checks provider ownership  │
└────────┬─────────────────────┘
         │
         └─ Provider check fails? ──► 403 Forbidden
                            │
                            ▼
                ┌──────────────────────────┐
                │ Response: 403 Forbidden  │
                │ {                        │
                │   "error": "Only the     │
                │   service provider can   │
                │   accept bookings"       │
                │ }                        │
                └──────────────────────────┘
```

---

## 📊 Database State Changes

```
BEFORE (Pending Booking):
┌─────────────────────────────────────────────┐
│ BOOKINGS TABLE                              │
├─────────────────────────────────────────────┤
│ id: 123e4567-e89b-12d3-a456-426614174000   │
│ service_id: 550e8400-e29b-41d4-a716-446... │
│ seeker_id: 550e8400-e29b-41d4-a716-446... │
│ status: "pending"  ← WAITING FOR DECISION  │
│ created_at: 2024-01-15 10:00:00            │
│ updated_at: 2024-01-15 10:00:00            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ NOTIFICATIONS TABLE                         │
├─────────────────────────────────────────────┤
│ (no notification yet)                       │
└─────────────────────────────────────────────┘


AFTER (Booking Accepted):
┌─────────────────────────────────────────────┐
│ BOOKINGS TABLE                              │
├─────────────────────────────────────────────┤
│ id: 123e4567-e89b-12d3-a456-426614174000   │
│ status: "approved"  ← UPDATED!              │
│ updated_at: 2024-01-15 10:05:00  ← UPDATED!│
└─────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ NOTIFICATIONS TABLE                          │
├──────────────────────────────────────────────┤
│ id: 987fcdeb-51a2-41d4-b716-446655440111   │
│ user_id: 550e8400-e29b-41d4-a716-446...     │ (seeker)
│ type: "booking_accepted"                    │
│ title: "Booking Accepted"                   │
│ message: "Your booking has been accepted..." │
│ entity_type: "booking"                      │
│ entity_id: 123e4567-e89b-12d3-a456-426...  │
│ is_read: false  ← UNREAD                    │
│ created_at: 2024-01-15 10:05:00             │
└──────────────────────────────────────────────┘
```

---

## 🎯 Summary: What Happens When Button is Clicked

```
USER CLICKS "ACCEPT" BUTTON
         │
         ▼
┌──────────────────────────────┐
│ Frontend useBookings Hook    │
│ acceptBooking(bookingId)     │
└────────┬─────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ API Call                               │
│ PUT /bookings/{id}/accept              │
│ Headers:                               │
│   Authorization: Bearer {token}        │
│   Content-Type: application/json       │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ Backend Authentication Middleware          │
│ - Verifies JWT token                       │
│ - Sets req.user = { id, email, role }    │
└────────┬───────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ Backend bookings.acceptBooking()           │
│ - const userId = req.user?.id              │
│ - if (!userId) return 401                  │
│ - Verify provider ownership                │
│ - Update booking status                    │
│ - Create notification                      │
│ - Emit Socket.io event                     │
└────────┬───────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ Socket.io Server                           │
│ io.emit('booking:status-changed', {        │
│   bookingId,                               │
│   status: 'approved',                      │
│   seekerId,                                │
│   notification                             │
│ })                                         │
└────────┬───────────────────────────────────┘
         │
    ┌────┴────┐
    │          │
    │ Network │ (Real-time WebSocket)
    │          │
    ▼          ▼
Provider    Seeker
Browser     Browser
(ignores)   (RECEIVES!)
            │
            ▼
       Socket listener
       handleBookingStatusChanged()
            │
            ▼
       dispatch(fetchNotifications())
       dispatch(fetchUnreadCount())
            │
            ▼
       Redux state updates
            │
            ▼
       UI re-renders with:
       - Badge showing "1"
       - Notification in dropdown
       - Correct title/message
            │
            ▼
       ✅ USER SEES NOTIFICATION IMMEDIATELY!
```

---

## 📋 Legend

```
✅ = Implemented & Working
🟢 = Running/Active
📡 = Real-time communication
🔐 = Security/Authentication
📝 = Database operation
🎯 = Success/Goal achieved
```
