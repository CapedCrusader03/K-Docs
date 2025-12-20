-- Create documents table for storing CRDT binary state
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    data BYTEA,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_documents table to link users to documents
CREATE TABLE IF NOT EXISTS user_documents (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
    PRIMARY KEY (user_id, document_id)
);

