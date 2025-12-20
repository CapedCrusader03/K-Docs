import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { QuillBinding } from 'y-quill';

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

  // Cleanup function that captures current values
  const cleanup = () => {
    const binding = bindingRef.current;
    const provider = providerRef.current;
    const ydoc = ydocRef.current;
    const quill = quillRef.current;
    const container = editorRef.current;

    if (binding) {
      try {
        binding.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      bindingRef.current = null;
    }

    if (provider) {
      try {
        provider.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      providerRef.current = null;
    }

    if (ydoc) {
      try {
        ydoc.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      ydocRef.current = null;
    }

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

    // Cleanup any existing instances first
    cleanup();

    const container = editorRef.current;
    if (!container) return;

    // Ensure container is empty before initializing
    container.innerHTML = '';

    // Initialize Quill with cursors module
    quillRef.current = new Quill(container, {
      theme: 'snow',
      modules: {
        cursors: true
      }
    });

    // Initialize Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create WebsocketProvider with document ID from URL
    const provider = new WebsocketProvider('ws://localhost:1234', id, ydoc);
    providerRef.current = provider;

    // Bind Yjs to Quill with awareness for user cursors
    const ytext = ydoc.getText('quill');
    const binding = new QuillBinding(ytext, quillRef.current, provider.awareness);
    bindingRef.current = binding;

    // Return cleanup function
    return cleanup;
  }, [id, navigate]);

  return <div ref={editorRef} style={{ minHeight: '500px' }}></div>;
};

