import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { URL } from 'url';
import { checkDb, pool } from './db';
import { postgresPersistence } from './persistence';
import authRoutes from './routes/auth';
import documentsRoutes from './routes/documents';
// @ts-ignore - CommonJS import for ES module package
const { setupWSConnection, setPersistence } = require('@y/websocket-server/utils');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use('/api', authRoutes);
app.use('/api/documents', documentsRoutes);

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
  try {
    // Parse URL to get query parameters and path
    // y-websocket may construct URL as: ws://host/{roomName} or ws://host/{roomName}?token=...
    const rawUrl = request.url || '';
    
    // Try using URL constructor first
    let token: string | null = null;
    let docId: string | null = null;
    
    try {
      const url = new URL(rawUrl, `http://${request.headers.host}`);
      token = url.searchParams.get('token');
      const pathParts = url.pathname.split('/').filter(Boolean);
      docId = pathParts[0];
    } catch (e) {
      // Fallback: manual parsing if URL constructor fails
      const urlMatch = rawUrl.match(/^([^?]+)(\?.*)?$/);
      const path = urlMatch ? urlMatch[1] : '';
      const queryString = urlMatch && urlMatch[2] ? urlMatch[2].substring(1) : '';
      const queryParams = new URLSearchParams(queryString);
      token = queryParams.get('token');
      const pathParts = path.split('/').filter(Boolean);
      docId = pathParts[0];
    }
    
    // If token is in query params but room name might include it, check room name too
    // Format: {docId}?token={token} (y-websocket might put query in room name)
    if (!token && docId && docId.includes('?token=')) {
      const roomParts = docId.split('?token=');
      docId = roomParts[0];
      const roomQuery = new URLSearchParams(roomParts[1] || '');
      token = roomQuery.get('token');
    }

    // Validate token
    if (!token) {
      console.log('WebSocket connection rejected: No token provided');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Verify JWT token
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      userId = decoded.userId;
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Validate document ID exists
    if (!docId) {
      console.log('WebSocket connection rejected: No document ID in path');
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // Check if user has access to the document
    const accessCheck = await pool.query(
      'SELECT role FROM user_documents WHERE user_id = $1 AND document_id = $2',
      [userId, docId]
    );

    if (accessCheck.rows.length === 0) {
      console.log(`WebSocket connection rejected: User ${userId} does not have access to document ${docId}`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    console.log(`WebSocket connection allowed: User ${userId} (${accessCheck.rows[0].role}) accessing document ${docId}`);

    // If all checks pass, upgrade the connection
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log('Connection established.');
      wss.emit('connection', ws, request);
    });
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

const PORT = 1234;

server.listen(PORT, async () => {
  console.log('Listening');
  await checkDb();
  
  // Set up persistence
  setPersistence(postgresPersistence);
  console.log('Persistence enabled');
});

