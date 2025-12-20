import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import bodyParser from 'body-parser';
import { checkDb } from './db';
import { postgresPersistence } from './persistence';
import authRoutes from './routes/auth';
import documentsRoutes from './routes/documents';
// @ts-ignore - CommonJS import for ES module package
const { setupWSConnection, setPersistence } = require('@y/websocket-server/utils');

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

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log('Connection established.');
    wss.emit('connection', ws, request);
  });
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

