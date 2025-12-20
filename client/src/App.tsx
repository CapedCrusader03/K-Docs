import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './components/Editor';

function EditorWithKey() {
  const { id } = useParams<{ id: string }>();
  return <Editor key={id} />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/doc/:id" element={<EditorWithKey />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

