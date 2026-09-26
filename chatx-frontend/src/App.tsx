import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { HomePage } from './pages/app/HomePage';
import { ProfilePage } from './features/profile/pages/ProfilePage';
import { FriendsPage } from './features/friends/pages/FriendsPage';
import { ChatPage } from './features/chat/pages/ChatPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './features/admin/components/AdminRoute';
import { AdminDashboardPage } from './features/admin/pages/AdminDashboardPage';
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
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <FriendsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
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
