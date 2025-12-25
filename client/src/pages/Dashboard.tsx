import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface Document {
  id: string;
  title: string;
  updated_at: string;
  role: string;
}

export const Dashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Remove any stray Quill toolbars that might have persisted
    const strayToolbars = document.querySelectorAll('.ql-toolbar');
    const strayContainers = document.querySelectorAll('.ql-container');
    strayToolbars.forEach(toolbar => toolbar.remove());
    strayContainers.forEach(container => container.remove());
    
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

              const response = await fetch(`${API_BASE_URL}/api/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setCreateError('');
    setCreating(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const title = newDocTitle.trim();
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title || undefined })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create document');
      }

      const data = await response.json();
      setShowCreateModal(false);
      setNewDocTitle('');
      setCreating(false);
      navigate(`/doc/${data.id}`);
    } catch (err) {
      console.error('Create document error:', err);
      setCreateError(err instanceof Error ? err.message : 'Failed to create document');
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>My Documents</h2>
        <div>
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            Create Document
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {documents.length === 0 ? (
        <div>No documents yet. Click "Create Document" to get started.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {documents.map((doc) => (
            <li 
              key={doc.id}
              onClick={() => navigate(`/doc/${doc.id}`)}
              style={{
                padding: '15px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9f9f9';
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{doc.title}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Updated: {new Date(doc.updated_at).toLocaleString()} • Role: {doc.role}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}
          onClick={() => {
            setShowCreateModal(false);
            setNewDocTitle('');
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Document</h2>
            
            <form onSubmit={handleCreateDocument}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="doc-title"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#333'
                  }}
                >
                  Document Name
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Untitled Document"
                  autoFocus
                  disabled={creating}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    opacity: creating ? 0.6 : 1
                  }}
                />
              </div>

              {createError && (
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#fee',
                    color: '#c33',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}
                >
                  {createError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewDocTitle('');
                    setCreateError('');
                  }}
                  disabled={creating}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#f1f1f1',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: creating ? '#ccc' : '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

