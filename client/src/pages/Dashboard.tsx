import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  updated_at: string;
  role: string;
}

export const Dashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

      const response = await fetch('http://localhost:1234/api/documents', {
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

  const handleCreateDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:1234/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const data = await response.json();
      navigate(`/doc/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Documents</h1>
        <div>
          <button 
            onClick={handleCreateDocument}
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
              <div style={{ fontWeight: 'bold' }}>Document {doc.id.substring(0, 8)}...</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Updated: {new Date(doc.updated_at).toLocaleString()} • Role: {doc.role}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

