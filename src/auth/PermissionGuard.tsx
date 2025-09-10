import React from 'react';
import { Navigate } from 'react-router';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';

interface PermissionGuardProps {
  required: string[];
  children: React.ReactElement;
}

const PermissionGuard = ({ required, children }: PermissionGuardProps) => {
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const ok = required.every((k) => !!perms[k]);
  if (!ok) return <Navigate to="/error/404" replace />;
  return children;
};

export { PermissionGuard };

