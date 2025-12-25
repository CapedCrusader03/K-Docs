# K-Docs

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://your-domain.com)

**K-Docs** is a real-time collaborative document editor similar to Google Docs, built with React and TypeScript. Create, edit, and share documents with multiple users simultaneously, featuring rich text editing, user cursors, and flexible permission management.

**🌐 [Try it live](http://3.239.93.189/login)**

## ✨ Features

- **Real-time Collaboration**: Live editing with conflict-free synchronization (using CRDT)
- **Rich Text Editor**: Full formatting support with Quill.js
- **User Cursors**: See where other users are typing
- **Flexible Permissions**:
  - **Owners**: Can edit and share documents with editors or viewers
  - **Editors**: Can edit documents and share viewer access only
  - **Viewers**: Read-only access, cannot share documents
- **User Authentication**: JWT-based secure login
- **Persistent Storage**: PostgreSQL database
- **Docker Ready**: Production-ready containerization

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Local Development

```bash
# Clone and setup
git clone <your-repo-url>
cd k-docs

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start services
docker compose up -d --build

# Access application
# Frontend: http://localhost:3000
# API: http://localhost:1234
```

### Production Deployment

```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d --build
```

## 🏗️ Architecture

**Tech Stack:**
- **Frontend**: React 19, TypeScript, Vite, React Router
- **Backend**: Node.js, Express, TypeScript, WebSocket
- **Database**: PostgreSQL
- **Real-time**: Yjs, Y-WebSocket, Quill.js
- **Auth**: JWT, bcryptjs
- **Deployment**: Docker, Nginx

**Services:**
- **Client**: React app served by Nginx
- **Server**: Node.js API with WebSocket support
- **Database**: PostgreSQL for data persistence

## 📋 API Overview

### Authentication
```bash
POST /api/register  # User registration
POST /api/login     # User login
```

### Documents
```bash
GET    /api/documents        # List user's documents
POST   /api/documents        # Create new document
GET    /api/documents/:id    # Get document metadata
POST   /api/documents/:id/share # Share document
```

### Real-time
- WebSocket connection on port 1234 for live editing

## ⚙️ Configuration

Create `.env` file:

```env
# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=kdocs

# JWT Secret (generate secure random string)
JWT_SECRET=your_jwt_secret_here

# Client URLs
VITE_API_BASE_URL=http://localhost:1234
VITE_WS_BASE_URL=ws://localhost:1234
CLIENT_PORT=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

