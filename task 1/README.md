# MeetFlow 🎥
> **Connect. Collaborate. Learn. Anywhere.**  
> A complete, enterprise-grade real-time video conferencing, video learning, and community platform built with React, Node.js, Express, MongoDB, WebRTC, and Socket.IO.

---

## 📑 Table of Contents
1. [Project Overview & Architecture](#-project-overview--architecture)
2. [Implemented Feature Modules (Official Tasks)](#-implemented-feature-modules)
3. [Folder Structure](#-folder-structure)
4. [Prerequisites](#-prerequisites)
5. [Installation & Setup](#-installation--setup)
6. [Environment Variables](#-environment-variables)
7. [Razorpay Test Mode & Subscription Setup](#-razorpay-test-mode--subscription-setup)
8. [Email & OTP Verification Setup](#-email--otp-verification-setup)
9. [Multilingual Translation Setup](#-multilingual-translation-setup)
10. [WebRTC STUN & TURN Configuration](#-webrtc-stun--turn-configuration)
11. [Automated Test Suites & Sample Procedures](#-automated-test-suites--sample-procedures)
12. [Known Limitations & Mesh Scalability Notes](#-known-limitations--mesh-scalability-notes)

---

## 🌟 Project Overview & Architecture

MeetFlow integrates real-time communications with structured educational video workflows:
- **Client Frontend:** Single Page Application (SPA) built using React 18, Vite, and Tailwind CSS.
- **Application Server:** RESTful API and WebSocket signaling engine built on Node.js and Express with Socket.IO.
- **Database:** MongoDB 6.0+ via Mongoose providing atomic transactions, compound indexing, and schema validation.
- **Media Architecture:** WebRTC (RTCPeerConnection) in a full-mesh topology for peer-to-peer audio/video streaming, combined with DTLS-SRTP encryption and STUN/TURN NAT traversal.
- **Security Core:** bcrypt 12-round password hashing, JWT bearer tokens, device fingerprinting, HMAC-SHA256 OTP tokens, and role-based access control (Admin, Moderator, User).

---

## 🚀 Implemented Feature Modules

### Task 1: Real-Time One-to-One and Small-Group WebRTC Video Calling
- **Full Mesh Topology:** Real-time peer-to-peer audio/video calls using `RTCPeerConnection` for 1-to-1 and small groups (up to 6 participants).
- **Socket.IO Signaling:** Authenticated, rate-limited signaling engine relaying WebRTC offers, answers, and ICE candidate exchanges.
- **Media Controls:** Hardware-level mic mute/unmute, camera on/off, and camera device switching (`facingMode: 'user' | 'environment'`).
- **Screen Sharing:** Integrated via `navigator.mediaDevices.getDisplayMedia` with dynamic video track replacement across all active RTCRtpSenders; automatically restores camera video track when screen sharing terminates.
- **In-Call Collaboration:** Live chat with quick emoji reactions, file transfer (validated for safe extensions and size $\le$ 10MB), and hand raising (`✋`).
- **Speaking & Connection Indicators:** Real-time audio analysis highlighting the active speaker; connection quality indicators based on `getStats()`.
- **Host Moderation:** Polite remote mute requests, participant removal (kick), meeting locking, co-host delegation, and end-meeting-for-all.
- **Host Local Recording:** Client-side host recording using `MediaRecorder` API with consent notifications broadcast to all peers.

### Task 2: Secure Video Download Management System
- **Tiered Quotas:** Strict daily and monthly limits for Free (1/day, 5/mo), Bronze (3/day, 20/mo), Silver (10/day, 100/mo), and Gold (50/day, 500/mo). Derived strictly on the backend.
- **Atomic Reservation:** Concurrency-safe quota allocation via MongoDB atomic operations, preventing quota bypass during parallel requests or page refreshes.
- **15-Minute Deduplication Window:** Re-downloading the same video within 15 minutes consumes 0 quota (`isDeduplicated: true`).
- **IST Midnight Reset:** Daily quota resets at exactly 00:00:00 IST (UTC+5:30) every day.
- **Signed Controlled Streaming Delivery:** Downloads delivered via short-lived HMAC-SHA256 signed tokens (`/api/downloads/stream/:token`), preventing public URL leakage.
- **Failed Transfer Accounting:** Requests rejected for licensing or quota reasons never consume quota; interrupted streams roll back reserved quota.

### Task 3: Camera and Microphone Device Integration & Preview
- Real-time mirrored HTML5 `<video>` preview with track-level hardware controls.
- On-demand permission acquisition with informative error states (Permission Denied, Device in Use, Hardware Not Found).
- Dynamic device selection (Audio input, Video input) with memory cleanup on unmount (`track.stop()`).

### Task 4: User Authentication & Account Security
- **Device-Aware Authentication:** Device fingerprinting (Browser, OS, IP, Device Type). Login from an unverified device triggers a 6-digit email OTP.
- **Cryptographic OTP Security:** Plaintext OTP is never stored in MongoDB; only an HMAC-SHA256 hash with a 10-minute expiry and 5-attempt rate limit.
- **IST Time-Aware Auto Theme:** Automatically renders Light theme between 05:00 and 12:00 IST and Dark theme otherwise; overrides persist to user profile.
- **Security Audit Dashboard (`/security`):** Complete login history table and active trusted devices manager with single or bulk session revocation.

### Task 5: Video Player & Learning Platform
- **Custom Player:** Play/pause, scrub bar, time tracking, volume/mute, playback speed (0.5x to 2x), fullscreen, keyboard shortcuts modal, and Next Video overlay.
- **Resume Playback & Watch History:** Playback position saved periodically and restored upon re-opening video. Videos marked complete only when reaching $\ge$ 90% threshold.

### Task 6: Multilingual Commenting & Moderation System
- **Threaded Discussions:** Top-level comments and chronological threaded replies.
- **15-Minute Edit Window:** Authors can edit their own comments within 15 minutes of posting. Past 15 minutes, edits are strictly rejected with HTTP 403.
- **Reactions (Likes/Dislikes):** Atomic like/dislike toggle, switching, and duplicate reaction prevention.
- **Location Privacy:** Location is stored and displayed **only** if the user explicitly checks the opt-in consent box. Never inferred from private IP data.
- **Abuse & Link Filtering:** Profanity filtering with whole-word regex (zero false positives on "classic" or "class"), malicious link detection (IP addresses and executable links blocked), and duplicate comment prevention (5-minute window).
- **Translation Engine:** Configurable translation provider (MyMemory, Google, DeepL) with MongoDB translation caching (`CommentTranslationCache`).
- **Moderator Queue & Actions:** Flagged comments enter a moderation queue; authorized moderators can approve, hide, delete, or dismiss reports with complete audit logging.

---

## 📂 Folder Structure

```
├── dist/                          # Production client build output
├── public/                        # Static assets, subtitles, and icons
├── server/                        # Express, Socket.IO & MongoDB Backend
│   ├── src/
│   │   ├── config/                # Environment, DB, and Policy configs
│   │   ├── controllers/           # Auth, Video, Download, Subscription, Comments
│   │   ├── data/                  # Video catalog & metadata
│   │   ├── middleware/            # JWT auth, role authorization, rate limiters
│   │   ├── models/                # User, Subscription, DownloadRecord, Comment, etc.
│   │   ├── routes/                # Express API routes
│   │   ├── socket/                # Socket.IO WebRTC signaling engine
│   │   ├── utils/                 # JWT, OTP, Device Parser, Token Signer, Translator
│   │   └── server.js              # Application entry point
│   ├── .env.example               # Backend environment template
│   └── package.json               # Backend dependencies
├── src/                           # React 18 Frontend Application
│   ├── components/
│   │   ├── auth/                  # ProtectedRoute, AuthModal
│   │   ├── comments/              # CommentsSection, CommentItem, Modals
│   │   ├── common/                # Navbar, Footer, Modal, Toast, Button
│   │   ├── meeting/               # MeetingStage, VideoTile, MeetingControls, Sidebar
│   │   └── player/                # CustomVideoPlayer, ScrubBar, NextOverlay
│   ├── context/                   # AuthContext, ThemeContext
│   ├── hooks/                     # useLocalMedia, useWebRTCCall, useMeetingTimer
│   ├── pages/                     # HomePage, RoomPage, VideoCatalogPage, DownloadsPage...
│   ├── utils/                     # API client, device fingerprinting, formatters
│   ├── App.jsx                    # Root route definitions
│   └── main.jsx                   # React DOM entry point
├── .env.example                   # Frontend environment template
├── package.json                   # Root/Frontend dependencies
└── README.md                      # Project documentation
```

---

## 💻 Prerequisites

- **Node.js:** v18.0.0 or higher (Tested on v22.23.1)
- **MongoDB:** Community Server v6.0+ running locally or MongoDB Atlas connection string
- **NPM:** v9.0+

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/meetflow.git
cd meetflow
```

### 2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment configuration
```bash
# Copy backend template
cp server/.env.example server/.env

# Copy frontend template
cp .env.example .env.local
```

### 4. Start the Application

**Option A: Running in two terminals**
```bash
# Terminal 1: Start Backend (Port 5001)
cd server
npm start

# Terminal 2: Start Frontend (Port 3000)
npm run dev
```

**Option B: Production Build Verification**
```bash
npm run build
npm run preview
```

---

## 🔐 Environment Variables

### Backend (`server/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend listening port | `5001` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/meetflow` |
| `JWT_SECRET` | Primary JWT token signing secret | *(Required in prod)* |
| `JWT_TEMP_SECRET` | Short-lived token secret for pending OTP state | *(Required in prod)* |
| `SMTP_HOST` | SMTP server host for sending OTP emails | `smtp.example.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | *(Optional in dev)* |
| `SMTP_PASS` | SMTP password | *(Optional in dev)* |
| `DOWNLOAD_TOKEN_SECRET` | Secret for HMAC-SHA256 download token signing | *(Required in prod)* |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID | `rzp_test_meetflow2026` |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Key Secret | `rzp_secret_meetflow2026_test` |
| `TRANSLATION_PROVIDER` | Provider: `mymemory` / `google` / `deepl` | `mymemory` |
| `MAX_ROOM_PARTICIPANTS` | Mesh participant ceiling | `6` |
| `TURN_SERVER_URL` | TURN relay server URL | *(Optional)* |
| `TURN_USERNAME` | TURN credential username | *(Optional)* |
| `TURN_CREDENTIAL` | TURN credential password | *(Optional)* |

---

## 💳 Razorpay Test Mode & Subscription Setup

MeetFlow features full Razorpay test-mode integration:
1. `POST /api/subscription/create-order` creates an order for Bronze (₹199), Silver (₹499), or Gold (₹999) and stores an idempotent `PaymentRecord`.
2. `POST /api/subscription/verify-payment` verifies the cryptographic signature:
   $$\text{HMAC-SHA256}(\text{orderId} \mathbin{\Vert} \text{"|"} \mathbin{\Vert} \text{paymentId}, \text{secret})$$
3. On verification, the user's active `Subscription` is activated for 30 days and the transaction is captured. Duplicate webhook/callback attempts are handled idempotently.

---

## 📧 Email & OTP Verification Setup

- If SMTP credentials (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are configured, OTP emails are dispatched via Nodemailer.
- If SMTP credentials are left blank (default in development), **OTPs are logged cleanly to the backend terminal console** (`[DEV OTP] Generated OTP for user@example.com: 123456`). This enables frictionless local testing without configuring a third-party mailer.

---

## 🌐 Multilingual Translation Setup

- **Default Provider:** `mymemory` (free, verified, public, requires no API key for low-to-medium community traffic).
- **Google Cloud / DeepL:** Set `TRANSLATION_PROVIDER=google` and `GOOGLE_TRANSLATION_API_KEY`, or `TRANSLATION_PROVIDER=deepl` and `DEEPL_API_KEY`.
- If credentials are missing or the provider is unreachable, the system responds with an explicit error code and renders *"Translation service currently unavailable"*. Failed translations are never falsely presented as succeeded.

---

## 📡 WebRTC STUN & TURN Configuration

- **STUN:** Defaults to Google's public STUN servers:
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
- **TURN:** To route media through a TURN relay across restrictive firewalls or symmetric NATs, provide:
  ```env
  TURN_SERVER_URL=turn:your-turn-server.com:3478
  TURN_USERNAME=your_turn_user
  TURN_CREDENTIAL=your_turn_password
  ```

---

## 🧪 Automated Test Suites & Sample Procedures

MeetFlow includes automated test suites covering all official task domains:

### 1. Run WebRTC Mesh & Signaling Test Suite
```bash
node server/src/test_webrtc_signaling_suite.js
```
*Validates room creation, peer joins, offer/answer signal relay, media toggles, in-call chat, 10MB file validation, mute requests, room lock, and participant kick.*

### 2. Run Multilingual Comments & Moderation Suite
```bash
node server/src/test_comments_suite.js
```
*Validates author identity, threaded replies, 15m edit window expiration, reactions, location privacy, profanity filtering, malicious link blocking, duplicate prevention, and moderator queue actions.*

### 3. Run Secure Video Downloads & Quota Suite
```bash
node server/src/test_downloads_suite.js
```
*Validates Free/Paid quotas, 429 quota exhaustion, 15m deduplication window, midnight IST reset, parallel race-condition atomic reservations, and frontend tampering immunity.*

### 4. Run Payments & Subscriptions Suite
```bash
node server/src/test_payments_suite.js
```
*Validates order generation, HMAC-SHA256 signature verification, duplicate callback idempotency, and 30-day subscription activation.*

---

## ⚠️ Known Limitations & Mesh Scalability Notes

1. **WebRTC Full Mesh Scaling:**
   - In a peer-to-peer mesh, each peer sends media directly to all $N-1$ other peers. Uplink bandwidth scales as $\mathcal{O}(N)$ per client, and total traffic scales as $\mathcal{O}(N^2)$.
   - The application strictly enforces a **6-participant limit** per room. For larger webinar rooms, an SFU (e.g. mediasoup / LiveKit) would be required.
2. **Localhost vs. HTTPS:**
   - On `localhost`, browsers treat the origin as a secure context for camera, mic, and screen share access.
   - For multi-device testing over a LAN or public internet, **HTTPS is required** by web browsers for media APIs to function.
3. **Hardware Muting:**
   - Browser WebRTC APIs do not permit a host to forcibly disable a remote user's physical hardware microphone. The platform provides a polite **Mute Request** to the participant alongside an immediate **Local Mute** action on the user's speaker.
