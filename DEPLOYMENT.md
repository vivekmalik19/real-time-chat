# PulseChat — 24/7 Live Deployment Guide

This guide will walk you through deploying **PulseChat** so that it runs live 24/7 on the internet for free.

---

## 🏆 Option 1: Deploy Live on Render.com (Recommended — 100% Free)

With Render, your full-stack app (React frontend + Express API + Socket.IO WebSockets) is hosted under a single public URL (`https://your-app.onrender.com`) with automated SSL certificates.

### Step 1: Set Up Free Cloud Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create a Deployment** and select the **M0 Free** cluster (AWS or Google Cloud, free forever).
3. **Set up Database Access**:
   - Create a database user (e.g., username `pulsechat`, and choose a secure password). Remember this password!
4. **Set up Network Access**:
   - Go to **Network Access** → **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect to it. Click **Confirm**.
5. **Get your Connection String**:
   - Go to **Database** → **Connect** → **Drivers** (Node.js).
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://pulsechat:<password>@cluster0.xxxx.mongodb.net/pulsechat?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password.

---

### Step 2: Push Code to GitHub
Open your terminal in `c:\Users\VIVEK MALIK\Documents\real time chat` and run:

```bash
git init
git add .
git commit -m "Initial commit for 24/7 live deployment"
```

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `pulse-chat`).
2. Link and push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/pulse-chat.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 3: Deploy to Render.com
1. Go to [Render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your `pulse-chat` GitHub repository.
4. Configure the settings:
   - **Name**: `pulsechat` (or any unique name you want)
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon, Ohio)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add:
   - `MONGO_URI`: *(Paste your MongoDB Atlas connection string from Step 1)*
   - `JWT_SECRET`: *(Any secret phrase, e.g. `pulsechat_live_prod_secret_2026`)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**!

🎉 In 2–3 minutes, Render will build the React frontend, start the backend, and provide your live URL (e.g. `https://pulsechat-xyz.onrender.com`). You can share this link with anyone anywhere in the world!

---

## ⚡ Option 2: Deploy on Railway.app (Fast Alternative)

1. Sign in to [Railway.app](https://railway.app) with your GitHub account.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `pulse-chat` repo.
4. Click **Variables** and add:
   - `MONGO_URI`: *(Your MongoDB Atlas connection string)*
   - `JWT_SECRET`: `pulsechat_live_prod_secret_2026`
   - `NODE_ENV`: `production`
5. Go to **Settings** → **Networking** → Click **Generate Domain**.
6. Railway will automatically build and start your application!

---

## 💻 Option 3: Run 24/7 Locally on your PC with PM2 (Self-Hosted)

If you want to keep the application running 24/7 in the background on your current Windows machine without any cloud accounts:

### 1. Build the production assets
In the project directory:
```bash
npm run build
```

### 2. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 3. Start PulseChat in the background
```bash
pm2 start server/server.js --name "pulsechat"
```

PulseChat is now running continuously in the background!
- Check status: `pm2 status`
- View live logs: `pm2 logs pulsechat`
- Stop service: `pm2 stop pulsechat`
- Restart service: `pm2 restart pulsechat`

### 4. Make it start automatically on Windows Startup
To make PM2 start automatically even if your computer restarts:
```bash
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

### 5. Accessing from the internet (Optional)
If you want external friends to access your local 24/7 server without port forwarding:
Download and run [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/) or `ngrok`:
```bash
npx ngrok http 5050
```
This gives you an instant public HTTPS link pointing to your local machine.
