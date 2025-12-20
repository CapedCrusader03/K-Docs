import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Editor } from './components/Editor';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Editor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

