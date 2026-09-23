import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { HomePage } from './pages/app/HomePage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-chatx-bg selection:bg-chatx-accent selection:text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#12121a',
              color: '#e4e4ef',
              border: '1px solid #2a2a3a',
            },
          }}
        />
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
