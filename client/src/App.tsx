import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './components/Editor';
import { Header } from './components/Header';

function EditorWithKey() {
  const { id } = useParams<{ id: string }>();
  return <Editor key={id} />;
}

function App() {
  return (
    <div>
      <Header />
      <div style={{ paddingTop: '50px' }}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/doc/:id" element={<EditorWithKey />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

