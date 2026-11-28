import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

// Renders its children (or nested routes) only for an authenticated user.
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait for the session check instead of redirecting too early.
  if (loading) {
    return (
      <p className="auth-loading" role="status">
        Checking your session...
      </p>
    );
  }

  if (!isAuthenticated) {
    // Remember where the user was going so login can return them there.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}

export default ProtectedRoute;

