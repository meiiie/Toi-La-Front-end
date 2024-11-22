// src/components/ProtectedRoute.tsx

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Navigate } from 'react-router-dom';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredPermissions: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermissions }) => {
  const user = useSelector((state: RootState) => state.users.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const hasPermission = user.roles.some((role) =>
    role.permissions.some((permission) => requiredPermissions.includes(permission)),
  );

  return hasPermission ? <>{children}</> : <Navigate to="/unauthorized" />;
};

export default ProtectedRoute;
