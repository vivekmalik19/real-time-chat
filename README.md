# PulseChat — MERN Real-Time Chat Application

PulseChat is a modern, full-stack real-time communication platform built on the **MERN** stack (MongoDB, Express, React, Node.js) with **Socket.IO** WebSockets, JWT authentication, channels, direct messaging, and a sleek dark theme.

![PulseChat Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## ⚡ Features

- 💬 **Real-Time Messaging**: Instant message delivery with Socket.IO WebSockets.
- 🏷️ **Channels & Rooms**: Default channels (`#general`, `#dev-talk`, `#random`) plus the ability to create custom channels with topics.
- 👤 **1-on-1 Direct Messaging (DMs)**: Chat privately with any member with real-time unread badges.
- 🟢 **Live User Presence**: Track who is online, away, busy, or offline with live status indicators.
- ✍️ **Typing Indicators**: Real-time "*Alice is typing...*" indicator with animated bouncing dots.
- 😃 **Message Reactions**: React to messages with emojis (👍, ❤️, 😂, 🔥, 🎉, 🚀) with live counters.
- 📎 **File & Image Sharing**: Drag & drop or upload files/photos with inline image previews and download links.
- ↩️ **Message Replies**: Quote and reply directly to specific messages.
- 🔍 **In-Chat Search**: Instant search through active channel or DM message history.
- 🔔 **Sound Notifications**: Modern Web Audio API incoming and outgoing message chimes (toggleable).
- 🚀 **Guest & Registered Modes**: Instant 1-click guest access for testing, or full account registration with password hashing.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite bundler)
- **Tailwind CSS** (Custom dark theme & glassmorphism)
- **Lucide React** (Modern clean iconography)
- **Socket.IO Client** (WebSocket client)
- **Axios** (REST API client with JWT interceptors)
- **Web Audio API** (Zero-asset audio synthesis)

### Backend
- **Node.js & Express** (RESTful API & Static file server)
- **MongoDB & Mongoose** (Persistent message history, user accounts, and channels)
- **Socket.IO** (Real-time bidirectional event engine)
- **JWT & Bcrypt.js** (Secure authentication & token management)
- **Multer** (File and image attachment uploads)

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local Windows service or MongoDB Atlas)

### 2. Run the Application
In the root directory, run:

```bash
npm run dev
```

This will concurrently launch:
- **Backend API & WebSockets**: [http://localhost:5050](http://localhost:5050)
- **Frontend Client**: [http://localhost:5173](http://localhost:5173)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📂 Project Structure

```
real time chat/
├── package.json               # Root orchestrator running both apps concurrently
├── server/
│   ├── .env                   # Port, MongoDB URI, and JWT Secret
│   ├── server.js              # Express app + Socket.IO server initialization
│   ├── config/
│   │   └── db.js              # Mongoose MongoDB connection
│   ├── models/
│   │   ├── User.js            # User profile, credentials, and status
│   │   ├── Channel.js         # Channels schema
│   │   └── Message.js         # Messages, attachments, reactions, replies
│   ├── middleware/
│   │   ├── auth.js            # JWT protection middleware
│   │   └── upload.js          # Multer file storage config
│   ├── routes/
│   │   ├── authRoutes.js      # Register, Login, Guest, Me, Profile
│   │   ├── channelRoutes.js   # Channels CRUD
│   │   ├── messageRoutes.js   # Message history, DMs, uploads
│   │   └── userRoutes.js      # User directory and search
│   ├── sockets/
│   │   └── chatSocket.js      # Real-time WebSocket event orchestration
│   └── uploads/               # Stored file attachments
└── client/
    ├── vite.config.js         # Proxy configuration
    ├── tailwind.config.js     # Dark theme colors
    └── src/
        ├── App.jsx            # Main app shell & layouts
        ├── socket.js          # Socket.io connection manager
        ├── context/
        │   ├── AuthContext.jsx # Authentication state
        │   └── ChatContext.jsx # Channel, DM, typing & reaction state
        ├── components/
        │   ├── Sidebar.jsx    # Channel list, DM list, user card
        │   ├── ChatArea.jsx   # Message stream, typing bar, header
        │   ├── MessageItem.jsx# Individual messages, reactions, replies
        │   ├── MessageInput.jsx # Text input, emoji picker, attachment preview
        │   ├── UserList.jsx   # Online/offline room members drawer
        │   ├── SearchModal.jsx# In-conversation search
        │   ├── ProfileModal.jsx # Avatar & status editor
        │   └── AuthModal.jsx  # Login, Register & Guest joins
        └── utils/
            ├── sound.js       # Web Audio API chime generator
            └── helpers.js     # Formatters for date, time, files, avatars
```

---

## 🧪 Testing Real-Time Multi-User Chat

To test real-time synchronization:
1. Open [http://localhost:5173](http://localhost:5173) in a normal browser tab and join as **"User 1"**.
2. Open [http://localhost:5173](http://localhost:5173) in an **Incognito / Private tab** and join as **"User 2"**.
3. Watch both users appear instantly in the **Online Members** list!
4. Send messages, react with emojis, upload pictures, and view live typing indicators across both windows.
