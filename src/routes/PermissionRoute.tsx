import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../api/authApi";

interface PermissionRouteProps {
  permission: string;
  children: ReactElement;
}

export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const user = getCurrentUser();
  const hasPermission = user?.permissions.includes(permission) ?? false;

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}