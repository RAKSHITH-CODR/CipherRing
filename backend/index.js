import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import uploadRoute from './routes/upload.js';
import authRoute from './routes/auth.js';
import { setupStreamingSocket } from './routes/streaming.js';
import { verifyToken } from './middleware/auth.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://rakshith-codr.github.io'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://rakshith-codr.github.io'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Auth routes (public)
app.use('/auth', authRoute);

// Protected REST API routes
app.use('/upload', verifyToken, uploadRoute);

// WebSocket streaming setup
setupStreamingSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Backend running on port ${PORT} (HTTP + WebSocket)`));
