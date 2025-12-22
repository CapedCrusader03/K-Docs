import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { QuillBinding } from 'y-quill';
import { API_BASE_URL, WS_BASE_URL } from '../config';
import { getUserFromToken } from '../utils/auth';

// Register the cursors module
Quill.register('modules/cursors', QuillCursors);

export const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<QuillBinding | null>(null);
  
  // User info state
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Document metadata state
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [isViewer, setIsViewer] = useState(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('editor');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Cleanup function that captures current values
  const cleanup = () => {
    const binding = bindingRef.current;
    const provider = providerRef.current;
    const ydoc = ydocRef.current;
    const quill = quillRef.current;
    const container = editorRef.current;

    // Cleanup binding first (removes Quill listeners)
    if (binding) {
      try {
        binding.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      bindingRef.current = null;
    }

    // Cleanup provider (closes WebSocket connection)
    if (provider) {
      try {
        // Disconnect awareness before destroying (removes awareness listeners)
        if (provider.awareness) {
          try {
            provider.awareness.destroy();
          } catch (e) {
            // Ignore awareness destroy errors
          }
        }
        // Destroy provider (closes WebSocket and removes all listeners)
        provider.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      providerRef.current = null;
    }

    // Cleanup Y.Doc (remove all event listeners)
    if (ydoc) {
      try {
        // Remove all event listeners by destroying the document
        ydoc.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      ydocRef.current = null;
    }

    // Cleanup Quill (remove DOM and listeners)
    if (quill && container) {
      try {
        // Remove Quill's toolbar and editor elements
        const toolbar = container.querySelector('.ql-toolbar');
        const editor = container.querySelector('.ql-container');
        
        if (toolbar) {
          toolbar.remove();
        }
        if (editor) {
          editor.remove();
        }
        // Also clear the container completely
        container.innerHTML = '';
      } catch (e) {
        // If that fails, just clear innerHTML
        if (container) {
          container.innerHTML = '';
        }
      }
      quillRef.current = null;
    }
  };

  // Fetch document metadata
  useEffect(() => {
    const fetchDocumentMetadata = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !id) return;

        const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
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
          throw new Error('Failed to fetch document metadata');
        }

        const data = await response.json();
        setDocumentTitle(data.title || 'Untitled Document');
        setUserRole(data.role || 'editor');
        setIsViewer(data.role === 'viewer');
      } catch (err) {
        console.error('Error fetching document metadata:', err);
      }
    };

    if (id) {
      fetchDocumentMetadata();
    }
  }, [id, navigate]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!id) {
      navigate('/');
      return;
    }

    // Wait for role to be fetched before initializing editor
    if (userRole === '') {
      return;
    }

    // Cleanup any existing instances first
    cleanup();

    const container = editorRef.current;
    if (!container) return;

    // Ensure container is empty before initializing
    container.innerHTML = '';

    // Initialize Quill with cursors module
    // If user is a viewer, make it read-only
    quillRef.current = new Quill(container, {
      theme: 'snow',
      modules: {
        cursors: true
      },
      readOnly: isViewer
    });

    // Initialize Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Get user info
    const userInfo = getUserFromToken();
    if (userInfo) {
      setUserEmail(userInfo.email);
    }

    // Create WebsocketProvider with document ID and token
    // y-websocket may not preserve query params, so we include token in room name
    // Format: {docId}?token={token}
    const roomName = `${id}?token=${encodeURIComponent(token)}`;
    const provider = new WebsocketProvider(WS_BASE_URL, roomName, ydoc);
    providerRef.current = provider;

    // Set awareness state with user email and color
    if (userInfo && provider.awareness) {
      // Generate a random color for the user
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      provider.awareness.setLocalStateField('user', {
        name: userInfo.email,
        color: randomColor
      });
    }

    // Bind Yjs to Quill with awareness for user cursors
    const ytext = ydoc.getText('quill');
    const binding = new QuillBinding(ytext, quillRef.current, provider.awareness);
    bindingRef.current = binding;

    // Cleanup on page unload (tab close, browser close, refresh)
    const handleBeforeUnload = () => {
      cleanup();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [id, navigate, isViewer, userRole]);

  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError('');
    setShareSuccess(false);
    setShareLoading(true);

    // Clear any existing timeout
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = null;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (!id) {
        setShareError('Document ID is missing');
        return;
      }

              const response = await fetch(`${API_BASE_URL}/api/documents/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: shareEmail, role: shareRole })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share document');
      }

      setShareSuccess(true);
      setShareEmail('');
      setShareRole('editor');
      // Close modal after 2 seconds
      shareTimeoutRef.current = setTimeout(() => {
        setShowShareModal(false);
        setShareSuccess(false);
        shareTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to share document');
    } finally {
      setShareLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (shareTimeoutRef.current) {
        clearTimeout(shareTimeoutRef.current);
        shareTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#f1f1f1',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
          {documentTitle && (
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
              {documentTitle}
            </span>
          )}
          {userEmail && (
            <span style={{ fontSize: '14px', color: '#666', marginLeft: '15px' }}>
              Logged in as: <strong style={{ color: '#333' }}>{userEmail}</strong>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isViewer && (
            <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
              View Only
            </span>
          )}
          {!isViewer && (
            <button
              onClick={() => {
                setShowShareModal(true);
                setShareError('');
                setShareSuccess(false);
                setShareEmail('');
                // Default role: owners start with editor, editors with viewer
                setShareRole(userRole === 'owner' ? 'editor' : 'viewer');
              }}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Share
            </button>
          )}
        </div>
      </div>

      {/* Editor Container - positioned below fixed navigation */}
      <div style={{ 
        marginTop: '50px', 
        minHeight: 'calc(100vh - 50px)',
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div ref={editorRef} style={{ 
          minHeight: 'calc(100vh - 90px)',
          width: '100%',
          backgroundColor: 'white'
        }}></div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
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
            if (!shareLoading) {
              setShowShareModal(false);
              setShareEmail('');
              setShareError('');
              setShareSuccess(false);
            }
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
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Share Document</h2>
            
            <form onSubmit={handleShare}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="share-email"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#333'
                  }}
                >
                  Email Address
                </label>
                <input
                  id="share-email"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={shareLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="share-role"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#333'
                  }}
                >
                  Permission Level
                </label>
                <select
                  id="share-role"
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as 'editor' | 'viewer')}
                  disabled={shareLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                    cursor: shareLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {userRole === 'owner' && (
                    <option value="editor">Editor (can edit)</option>
                  )}
                  <option value="viewer">Viewer (read-only)</option>
                </select>
              </div>

              {shareError && (
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
                  {shareError}
                </div>
              )}

              {shareSuccess && (
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#efe',
                    color: '#3c3',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}
                >
                  Document shared successfully!
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    setShareEmail('');
                    setShareError('');
                    setShareSuccess(false);
                  }}
                  disabled={shareLoading}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#f1f1f1',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: shareLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shareLoading || !shareEmail}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: shareLoading || !shareEmail ? '#ccc' : '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: shareLoading || !shareEmail ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {shareLoading ? 'Sharing...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

