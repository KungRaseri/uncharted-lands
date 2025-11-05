import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001;

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket server started on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    
    // Echo back for now - implement game logic here
    ws.send(JSON.stringify({
      type: 'echo',
      data: message.toString(),
      timestamp: new Date().toISOString()
    }));
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Uncharted Lands server',
    timestamp: new Date().toISOString()
  }));
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
