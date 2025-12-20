-- Create documents table for storing CRDT binary state
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    data BYTEA,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

