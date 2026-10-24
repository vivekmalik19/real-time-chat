# MeetFlow 🎥

> **Connect. Collaborate. Anywhere.**  
> A modern real-time video conferencing web application with an original SaaS design aesthetic.

---

## 🚀 Progress & Features

### 📅 Day 1: Frontend Foundation
- Brand identity with modern dark SaaS theme, deep slate, indigo, and violet accents.
- Landing page with MeetFlow branding, "Create Meeting" (generates unique IDs like `MF-A7K29X`), "Join Meeting" with validation, and feature cards.
- High-fidelity meeting mockup preview.
- Dynamic `/room/:roomId` route with base components and 404 handler.

### 📅 Day 2: Interactive Meeting Room UI
- Meeting duration timer with `useMeetingTimer`.
- Side panels for Participants, In-call Chat, and Meeting Info.
- Clipboard utility (`clipboard.js`) with formatted invitations and Room ID copying.
- Reusable `Modal.jsx` and `Toast.jsx` components.
- Leave confirmation modal.

### 📅 Day 3: Real Local Camera & Microphone Integration
- On-demand permission acquisition via `navigator.mediaDevices.getUserMedia()`.
- Real mirrored selfie preview canvas (`<video>` element with `autoPlay`, `playsInline`, `muted`).
- Track-level hardware toggles (`videoTrack.enabled`, `audioTrack.enabled`).
- Media status indicators with emerald/rose/slate badges.
- Hardware track cleanup on component unmount and meeting leave (`track.stop()`).

### 📅 Day 4: Backend & Secure Authentication Foundation (Current)
Comprehensive backend API with security-first authentication:
1. **Node.js & Express REST Backend** (`server/`):
   - Mongoose schemas: `User` and `LoginHistory` with compound indexes.
   - bcrypt 12-round password hashing and JWT authentication.
   - Device detection (browser, OS, deviceType, IP) respecting proxy configuration.
   - Safe geolocation handling: records location only when a reliable provider (`IPINFO_TOKEN`) is configured. Never invents data.
2. **Device-Aware Email OTP Verification**:
   - Initial registration auto-trusts the registering device for 30 days.
   - Login from a new browser/device or changed IP requires 6-digit email OTP.
   - Plaintext OTP is **never** stored in the database (stored as HMAC-SHA256 hash).
   - 10-minute expiry, 5-attempt brute-force limit, 60s resend cooldown.
   - Full JWT authentication token is **not granted** until OTP verification succeeds.
3. **IST Time-Aware Auto Theme**:
   - Automatically selects light theme between 05:00 and 12:00 IST (UTC+5:30) and dark theme otherwise.
   - Supports manual override (Light / Dark) saved to user profile in MongoDB and restored across sessions.
4. **Account Security & Session Management UI**:
   - `/profile`: View and update user profile and theme preference.
   - `/security`: Complete audit log table of past logins (timestamp, device, browser, IP, location, status).
   - Trusted devices list with single revocation and "Revoke All Other Devices" button.
5. **Security Hardening**:
   - Rate limiting on public and auth endpoints (`express-rate-limit`).
   - CORS policy with credentials support.
   - Centralized error handler and input validators.
   - `.env.example` with placeholder variable names only.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [React Router DOM v6](https://reactrouter.com/), [Lucide React](https://lucide.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Security & Auth**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [nodemailer](https://nodemailer.com/), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- **Media API**: HTML5 MediaDevices (`getUserMedia`), HTML5 Video

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd server
cp .env.example .env
npm install
npm start
```
The backend server runs on `http://localhost:5001`.

#### Backend Environment Variables (`server/.env`):
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP port | `5001` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/meetflow` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | `<random_secure_hex>` |
| `JWT_EXPIRES_IN` | Auth token validity duration | `7d` |
| `OTP_SECRET` | Secret key for HMAC-SHA256 OTP hashing | `<random_secure_hex>` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `SMTP_HOST` | *(Optional)* SMTP host for sending real emails | `smtp.example.com` |
| `SMTP_PORT` | *(Optional)* SMTP port | `587` |
| `SMTP_USER` | *(Optional)* SMTP username | `user@example.com` |
| `SMTP_PASS` | *(Optional)* SMTP password | `secret` |
| `IPINFO_TOKEN` | *(Optional)* Token for geolocation lookup | *(empty - no fake data)* |

> **Note**: If SMTP credentials are not configured, OTPs are safely logged to the backend console in development mode for easy testing.

### 3. Frontend Setup
```bash
# In the root project directory:
npm install
npm run dev
```
The frontend dev server runs on `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```

---

## 🧪 Testing the Authentication & Security Flow

An automated verification suite is included in `scratch/test_auth_flow.js`:
```bash
node "C:\Users\VIVEK MALIK\.gemini\antigravity\brain\6f251c24-57d8-45a1-b664-c48891bfdbc8\scratch\test_auth_flow.js"
```
Verifies 16 critical test cases including registration validation, trusted device immediate login, untrusted device OTP triggers, HMAC-SHA256 database protection, OTP attempt limits, theme persistence, and device revocation.
