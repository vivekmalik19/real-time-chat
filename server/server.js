const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { setupChatSocket } = require('./sockets/chatSocket');
const Channel = require('./models/Channel');

const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin like mobile apps, curl, postman
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow any local dev origin
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Root healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'PulseChat API' });
});

// Seed default channels if database is empty
const seedDefaultChannels = async () => {
  try {
    const defaultChannels = [
      { name: 'general', description: 'General community discussion and greetings' },
      { name: 'dev-talk', description: 'Code discussions, tech stack debates, and help' },
      { name: 'random', description: 'Memes, off-topic chat, and fun conversations' }
    ];

    for (const ch of defaultChannels) {
      const exists = await Channel.findOne({ name: ch.name });
      if (!exists) {
        await Channel.create({
          name: ch.name,
          description: ch.description,
          isPrivate: false
        });
        console.log(`[Seed] Created channel #${ch.name}`);
      }
    }
  } catch (err) {
    console.error('[Seed] Channel seed error:', err.message);
  }
};

seedDefaultChannels();

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupChatSocket(io);

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`[PulseChat] Server running on http://localhost:${PORT}`);
});
