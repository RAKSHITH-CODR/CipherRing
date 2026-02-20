import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import uploadRoute from './routes/upload.js';
import { setupStreamingSocket } from './routes/streaming.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// REST API routes
app.use('/upload', uploadRoute);

// WebSocket streaming setup
setupStreamingSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Backend running on port ${PORT} (HTTP + WebSocket)`));
