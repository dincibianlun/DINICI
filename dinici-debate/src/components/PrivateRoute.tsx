import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from 'tdesign-react';

interface PrivateRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

export const PrivateRoute = ({ 
  redirectPath = '/auth',
  children 
}: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading size="large" />;
  }

  if (!user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};