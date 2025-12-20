import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { QuillBinding } from 'y-quill';

export const Editor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<QuillBinding | null>(null);

  useEffect(() => {
    const container = editorRef.current;
    if (container && !quillRef.current) {
      // Initialize Quill
      quillRef.current = new Quill(container, {
        theme: 'snow'
      });

      // Initialize Yjs document
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      // Create WebsocketProvider
      const provider = new WebsocketProvider('ws://localhost:1234', 'test-room', ydoc);
      providerRef.current = provider;

      // Bind Yjs to Quill
      const ytext = ydoc.getText('quill');
      const binding = new QuillBinding(ytext, quillRef.current);
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
  }, []);

  return <div ref={editorRef}></div>;
};

