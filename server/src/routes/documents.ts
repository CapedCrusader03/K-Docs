import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/documents - Create a new document
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate UUID for document id
    const documentId = uuidv4();

    // Insert into documents table (with empty data initially)
    await pool.query(
      'INSERT INTO documents (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [documentId, null]
    );

    // Insert into user_documents with role 'owner'
    await pool.query(
      'INSERT INTO user_documents (user_id, document_id, role) VALUES ($1, $2, $3)',
      [userId, documentId, 'owner']
    );

    res.status(201).json({ id: documentId });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents - Get all documents for the user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all documents linked to the user
    const result = await pool.query(
      `SELECT d.id, d.updated_at, ud.role 
       FROM documents d
       INNER JOIN user_documents ud ON d.id = ud.document_id
       WHERE ud.user_id = $1
       ORDER BY d.updated_at DESC`,
      [userId]
    );

    res.json({ documents: result.rows });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/documents/:id/share - Share a document with another user
router.post('/:id/share', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const documentId = req.params.id;
    const { email } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if requester is the owner of the document
    const ownerCheck = await pool.query(
      'SELECT role FROM user_documents WHERE user_id = $1 AND document_id = $2',
      [userId, documentId]
    );

    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only document owners can share documents' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUserId = userResult.rows[0].id;

    // Check if user already has access
    const existingAccess = await pool.query(
      'SELECT role FROM user_documents WHERE user_id = $1 AND document_id = $2',
      [targetUserId, documentId]
    );

    if (existingAccess.rows.length > 0) {
      return res.status(409).json({ error: 'User already has access to this document' });
    }

    // Insert into user_documents with role 'editor'
    await pool.query(
      'INSERT INTO user_documents (user_id, document_id, role) VALUES ($1, $2, $3)',
      [targetUserId, documentId, 'editor']
    );

    res.status(200).json({ message: 'Document shared successfully' });
  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

