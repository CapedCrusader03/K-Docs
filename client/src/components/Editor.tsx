import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export const Editor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    const container = editorRef.current;
    if (container && !quillRef.current) {
      quillRef.current = new Quill(container, {
        theme: 'snow'
      });
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  return <div ref={editorRef}></div>;
};

