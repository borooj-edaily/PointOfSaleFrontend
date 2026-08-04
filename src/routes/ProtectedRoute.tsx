import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../api/authApi";

interface ProtectedRouteProps {
  children: ReactElement;
}

/**
 * Wrap any route element with this to require a logged-in user.
 * If there's no token in localStorage, the user is bounced back to /login
 * instead of being able to view the page directly by URL.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
}