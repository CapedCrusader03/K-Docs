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

export default router;

