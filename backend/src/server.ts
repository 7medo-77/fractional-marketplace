import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import OrderController from './controllers/OrderController';
import WebSocketHandler from './handlers/WebSocketHandler';
import MarketDataService from './services/MarketDataService';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', OrderController);

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(io);
wsHandler.initialize();

// Initialize market data service
const marketDataService = new MarketDataService(io);
marketDataService.start();

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready`);
  console.log(`📈 Market data generator started`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  marketDataService.stop();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});