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

    const container = editorRef.current;
    if (container && !quillRef.current) {
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
    }

    return () => {
      // Cleanup
      if (bindingRef.current) {
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [id, navigate]);

  return <div ref={editorRef}></div>;
};

