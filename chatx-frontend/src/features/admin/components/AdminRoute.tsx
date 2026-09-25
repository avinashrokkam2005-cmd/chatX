import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-chatx-bg">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-chatx-accent animate-spin" />
          <p className="text-sm text-chatx-text-secondary">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    toast.error('Access denied. Administrator privileges required.');
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
