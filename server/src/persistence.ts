import * as Y from 'yjs';
import { pool } from './db';

interface Persistence {
  bindState: (docName: string, ydoc: Y.Doc) => Promise<void>;
  writeState: (docName: string, ydoc: Y.Doc) => Promise<void>;
  provider: any;
}

// Debounce timers for writeState
const writeTimers = new Map<string, NodeJS.Timeout>();

export const postgresPersistence: Persistence = {
  provider: null,

  async bindState(docName: string, ydoc: Y.Doc): Promise<void> {
    try {
      const result = await pool.query(
        'SELECT data FROM documents WHERE id = $1',
        [docName]
      );

      if (result.rows.length > 0 && result.rows[0].data) {
        // Load existing state from database
        const binaryData = result.rows[0].data as Buffer;
        const update = new Uint8Array(binaryData);
        Y.applyUpdate(ydoc, update);
        console.log(`Loaded state for document: ${docName}`);
      } else {
        console.log(`No existing state for document: ${docName}, starting fresh`);
      }

      // Listen to document updates and trigger writes
      ydoc.on('update', () => {
        this.writeState(docName, ydoc).catch(err => {
          console.error(`Error in writeState from update listener: ${err}`);
        });
      });
    } catch (error) {
      console.error(`Error binding state for ${docName}:`, error);
      throw error;
    }
  },

  async writeState(docName: string, ydoc: Y.Doc): Promise<void> {
    // Clear existing timer for this document
    const existingTimer = writeTimers.get(docName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set a new timer to debounce writes (2 seconds)
    const timer = setTimeout(async () => {
      try {
        const update = Y.encodeStateAsUpdate(ydoc);
        await pool.query(
          'INSERT INTO documents (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP',
          [docName, Buffer.from(update)]
        );
        console.log(`Saved state for document: ${docName}`);
        writeTimers.delete(docName);
      } catch (error) {
        console.error(`Error writing state for ${docName}:`, error);
        writeTimers.delete(docName);
      }
    }, 2000);

    writeTimers.set(docName, timer);
  }
};

