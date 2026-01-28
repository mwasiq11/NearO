# Visual Guide - Where Everything Is

## 🎨 UI LAYOUT MAP

```
┌─────────────────────────────────────────────────────────────┐
│                       DASHBOARD HEADER                       │
│  [Sidebar Toggle] Home Search Browse    [🔔 Notifications]   │
│                                         [5]  [👤 Avatar]     │
└─────────────────────────────────────────────────────────────┘
          ↑
    THIS IS WHERE THE
    NOTIFICATION BELL GOES
    (Shows "5" unread)
          ↓
          Clicking reveals:
          ┌──────────────────────────────┐
          │    NOTIFICATIONS             │
          │  Mark all as read ✓          │
          ├──────────────────────────────┤
          │ ✅ Booking Accepted          │
          │    John accepted your        │
          │    service booking           │
          │    2 hours ago       [•]     │
          ├──────────────────────────────┤
          │ 💬 New Message               │
          │    Sarah sent you a          │
          │    message                   │
          │    1 hour ago        [•]     │
          ├──────────────────────────────┤
          │ 📅 New Booking               │
          │    Michael wants to book     │
          │    your lawn care service    │
          │    30 min ago                │
          └──────────────────────────────┘
```

---

## 📱 BOOKINGS PAGE LAYOUT

### Tab View
```
┌─────────────────────────────────────────┐
│ BOOKINGS                                │
│ Track upcoming and past requests         │
│                                         │
│ [My bookings] [Received  (2)]          │
│              ↑
│        SHOWS PENDING COUNT
│        AS BADGE
└─────────────────────────────────────────┘

When in "Received" tab:
┌─────────────────────────────────────────┐
│                                         │
│ Service booking                         │ ← Status badge
│ Dec 20, 2024 at 2:00 PM                 │   (Pending/Confirmed/
│ Total: $50.00                           │    Rejected/Completed)
│ Client notes...                         │
│                                    [✓] [✗]  ← Accept/Reject buttons
│                                 (green)(red)  (Only for pending!)
└─────────────────────────────────────────┘
```

---

## 💬 MESSAGES PAGE LAYOUT

### Conversation List
```
┌──────────────┬─────────────────────────┐
│ MESSAGES     │   Chat Area             │
│ 12 convos    │   (when conversation    │
│              │    is selected)         │
│ ┌──────────┐ │                         │
│ │ 👤 [5]   │ │   John Smith            │
│ │ John     │ │   ─────────────         │
│ │ Lawn Svc │ │                         │
│ │ Hey, can │ │   • John: Hey, when    │
│ │ you come │ │     can you come?      │
│ │          │ │     (12:30 PM)         │
│ │ UNREAD   │ │                         │
│ │ BOLD     │ │   • You: Tomorrow at   │
│ │ & BLUE   │ │     10 AM works!       │
│ │ BADGE    │ │     (12:45 PM)         │
│ └──────────┘ │                         │
│              │ [Type message...]       │
│ ┌──────────┐ │ [📎] [🎤] [📷] [➤]    │
│ │ 👤 Sarah │ │                         │
│ │ Read     │ │                         │
│ │ (no icon)│ │                         │
│ │ Thanks   │ │                         │
│ │          │ │                         │
│ └──────────┘ │                         │
│              │                         │
│ ┌──────────┐ │                         │
│ │ 👤 [3]   │ │                         │
│ │ Mike     │ │                         │
│ │ Service  │ │                         │
│ │ Can you  │ │                         │
│ │ help me  │ │                         │
│ │          │ │                         │
│ └──────────┘ │                         │
└──────────┬─────────────────────────┘
```

**Key Features:**
- 🔵 Blue badge = unread message count
- **Bold name** = has unread messages
- **Bold preview text** = unread content
- Clicking conversation = marks all as read
- Green dot = user is online

---

## 📊 SIDEBAR NAVIGATION

```
┌──────────────────────────┐
│ NearO Logo               │
├──────────────────────────┤
│ User Profile             │
│ [👤] John Smith          │
│ Member                   │
├──────────────────────────┤
│ Navigation               │
│                          │
│ 🏠 Home                  │
│ 🔍 Browse                │
│ 📦 My Services           │
│ 📅 Bookings         [2]  │ ← Shows pending count
│ 💬 Messages         [12] │ ← Shows total unread
│ 📈 Earnings              │
│ 👤 Profile               │
│                          │
├──────────────────────────┤
│ ⚙️  Settings             │
│ 🚪 Logout                │
└──────────────────────────┘
```

---

## 🔔 NOTIFICATION TYPES

```
New Booking (Seeker booked you):
┌─────────────────────────────┐
│ 📅 New Booking              │
│ Sarah booked your home      │
│ cleaning service            │
│ 2 hours ago              [•] │ ← Unread indicator
└─────────────────────────────┘

Booking Accepted (You accepted booking):
┌─────────────────────────────┐
│ ✅ Booking Accepted         │
│ John accepted your service  │
│ booking request             │
│ 1 hour ago                  │ ← Read (no dot)
└─────────────────────────────┘

Booking Rejected (You rejected booking):
┌─────────────────────────────┐
│ ⏱️ Booking Rejected          │
│ Provider rejected your      │
│ service booking request     │
│ 30 min ago               [•] │
└─────────────────────────────┘

New Message (Someone messaged you):
┌─────────────────────────────┐
│ 💬 New Message              │
│ Mike sent you a message     │
│ in Lawn Care Service        │
│ Just now                 [•] │
└─────────────────────────────┘

Review Received (Someone reviewed you):
┌─────────────────────────────┐
│ ⭐ Review Received          │
│ Sarah gave you 5 stars!     │
│ Great service, very quick   │
│ 1 min ago                [•] │
└─────────────────────────────┘
```

---

## 🔄 BOOKING STATUS FLOW

```
┌──────────┐
│ PENDING  │  ← Provider sees Accept/Reject buttons
│ 🟡       │     in "Received" tab
└────┬─────┘
     │
     ├─── [Accept] ────→ ┌───────────┐
     │                    │ CONFIRMED │  ← Seeker gets notification
     │                    │ 🟢        │     Booking is approved
     │                    └───────────┘
     │
     └─── [Reject] ────→ ┌───────────┐
                         │ CANCELLED │  ← Seeker gets notification
                         │ 🔴        │     Booking is rejected
                         └───────────┘
```

---

## 💾 DATABASE STRUCTURE

```
users
├── id
├── name
├── email
└── ...

conversations
├── id
├── seeker_id → users.id
├── provider_id → users.id
├── service_id
├── created_at
├── seeker_unread_count ← NEW
└── provider_unread_count ← NEW

messages
├── id
├── conversation_id → conversations.id
├── sender_id → users.id
├── content
├── created_at
└── ...

bookings
├── id
├── seeker_id → users.id
├── provider_id → users.id
├── service_id
├── status (pending/approved/rejected/completed)
├── requested_time
└── ...

notifications ← NEW TABLE
├── id
├── user_id → users.id
├── type (enum: new_booking, booking_accepted, 
│          booking_rejected, new_message, review_received)
├── title
├── message
├── entity_type (booking/message/review)
├── entity_id
├── is_read
└── created_at
```

---

## 🌐 API ENDPOINT MAP

```
/notifications (Group)
├── GET /notifications
│   └── Returns: [Notification, ...]
│   └── Query: ?unread_only=true (optional)
│
├── GET /notifications/unread-count
│   └── Returns: { count: 5 }
│
├── PUT /notifications/:id/read
│   └── Params: notificationId
│   └── Returns: { success: true }
│
└── PUT /notifications/read-all
    └── Returns: { success: true }

/bookings (Enhancement)
├── PUT /bookings/:id/accept
│   └── Only provider can use
│   └── Creates notification for seeker
│
└── PUT /bookings/:id/reject
    └── Only provider can use
    └── Creates notification for seeker

/messages (Enhancement)
└── PUT /messages/:conversationId/read
    └── Resets unread count to 0
    └── Marks all messages as read
```

---

## 🎯 USER JOURNEY

### Path 1: Provider Accepting Booking

```
1. User logs in
   ↓
2. Sees "2" badge on Bookings sidebar
   ↓
3. Clicks Bookings in sidebar
   ↓
4. Clicks "Received" tab
   ↓
5. Sees pending booking card with:
   - Date/Time
   - Price
   - Notes
   - Status: PENDING (yellow)
   - [Accept] [Reject] buttons
   ↓
6. Clicks [Accept] (green)
   ↓
7. Backend:
   - Updates booking.status = 'approved'
   - Creates notification for seeker
   - Logs audit trail
   ↓
8. UI Updates:
   - Button disappears
   - Status changes to CONFIRMED (green)
   - Toast: "Booking accepted!"
   ↓
9. Seeker sees:
   - Notification bell shows "1" badge
   - Click bell → sees "Booking Accepted" notification
   - Bookings page updates: status = CONFIRMED
```

### Path 2: Seeker Checking Unread Messages

```
1. User in Messages page
   ↓
2. Provider sends message
   ↓
3. Conversation shows:
   - Blue badge with "1" (unread count)
   - Bold name
   - Bold preview text
   ↓
4. Sidebar shows:
   - Messages link with total unread count
   ↓
5. User clicks conversation
   ↓
6. Backend marks as read:
   - UPDATE conversations SET
     seeker_unread_count = 0
   ↓
7. UI Updates:
   - Badge disappears
   - Text styling returns to normal
   - Name and preview no longer bold
```

### Path 3: Checking Notifications

```
1. User sees bell icon with badge "3"
   ↓
2. Clicks bell icon
   ↓
3. Dropdown appears with notifications:
   - ✅ Booking Accepted (2 hours ago)
   - 💬 New Message (1 hour ago)
   - 📅 New Booking (30 min ago)
   ↓
4. Each item shows:
   - Icon (color-coded)
   - Title
   - Message
   - Timestamp
   - Blue dot if unread
   ↓
5. Click notification → marks as read
   ↓
6. Or click "Mark all as read" → bulk action
   ↓
7. Blue dots disappear
   ↓
8. Icon badge count decreases
```

---

## 🎨 COLOR SCHEME

```
Status Colors:
🟡 Pending    #FCD34D (yellow)
🟢 Approved   #86EFAC (green)
🔴 Rejected   #FCA5A5 (red)
🔵 Completed  #93C5FD (blue)

Notification Icons:
📅 New Booking       Blue    #3B82F6
✅ Booking Accepted  Green   #10B981
⏱️ Booking Rejected   Red     #EF4444
💬 New Message       Purple  #8B5CF6
⭐ Review Received   Yellow  #F59E0B

UI Elements:
🔵 Unread Badge      Blue    #3B82F6
⚪ Online Status     Green   #22C55E
⚫ Offline Status    Gray    #6B7280
```

---

## 📈 INFORMATION HIERARCHY

```
Most Important (User sees first):
1. Unread badges (blue numbers)
2. Pending counts (red/yellow)
3. Status colors
4. Bold text (unread content)

Secondary (User explores):
1. Timestamps
2. Notification type icons
3. Message previews
4. User online status

Tertiary (Details):
1. Full notification messages
2. Booking notes
3. Service titles
4. User avatars
```

---

## ✅ INTERACTION CHECKLIST

- [ ] Click bell icon → dropdown appears
- [ ] See unread notification count
- [ ] See each notification with icon
- [ ] Click "Mark all as read" → count resets
- [ ] See blue badge on conversation
- [ ] Click conversation → badge disappears
- [ ] See pending booking badge
- [ ] Click Accept → notification sent
- [ ] See status color change
- [ ] Message sidebar shows total unread

**Everything working? You're all set!** 🚀
