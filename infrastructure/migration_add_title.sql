-- Migration: Add title column to documents table
-- Run this if you have an existing database without the title column

-- Add title column if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Document';

-- Update any existing documents that might have NULL titles
UPDATE documents SET title = 'Untitled Document' WHERE title IS NULL;

-- Update role constraint to include 'viewer' if needed
ALTER TABLE user_documents DROP CONSTRAINT IF EXISTS user_documents_role_check;
ALTER TABLE user_documents ADD CONSTRAINT user_documents_role_check CHECK (role IN ('owner', 'editor', 'viewer'));

