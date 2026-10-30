import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initMeetingSocket, getIceServers } from './socket/meetingSocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Respect proxy configuration (e.g. Nginx, Cloudflare)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// CORS setup
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static subtitles
app.use('/subtitles', express.static(path.join(__dirname, '../public/subtitles')));

// Apply general rate limiter to API routes
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MeetFlow Auth & Security Backend',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/comments', commentRoutes);

// Endpoint to expose STUN / TURN ICE servers securely
app.get('/api/meeting/ice-servers', (req, res) => {
  res.status(200).json({
    success: true,
    iceServers: getIceServers(),
  });
});

// Catch-all 404 for unknown API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Create HTTP server and attach Socket.IO signaling engine
const server = http.createServer(app);
initMeetingSocket(server);

// Start server after connecting to database
async function startServer() {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`[MeetFlow Server] Running in ${config.nodeEnv} mode on port ${config.port}`);
    console.log(`[MeetFlow Server] API Health: http://localhost:${config.port}/api/health`);
    console.log(`[MeetFlow Server] WebRTC Signaling Engine Ready on Socket.IO`);
  });
}

startServer();

export { app, server };
