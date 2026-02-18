import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to their appropriate dashboard
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "owner") return <Navigate to="/owner" replace />;
    if (userRole === "tenant") return <Navigate to="/tenant" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
