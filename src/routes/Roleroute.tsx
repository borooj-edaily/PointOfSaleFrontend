import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../api/authApi";

interface RoleRouteProps {
  role: string;
  children: ReactElement;
}

/**
 * Restricts a page to a single role (e.g. "Admin"), unlike PermissionRoute
 * which checks a granular permission. Anyone logged in but with a different
 * role gets bounced to /unauthorized instead of seeing the page.
 */
export function RoleRoute({ role, children }: RoleRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const user = getCurrentUser();
  if (user?.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}