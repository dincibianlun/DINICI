import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading, MessagePlugin } from 'tdesign-react';

interface AdminRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export const AdminRoute = ({ 
  children, 
  redirectPath = '/library' 
}: AdminRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading size="large" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    MessagePlugin.error('需要管理员权限才能访问此页面');
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
