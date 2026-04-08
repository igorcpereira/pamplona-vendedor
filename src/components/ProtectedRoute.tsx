import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireUnidade?: boolean;
}

export default function ProtectedRoute({
  children,
  requireUnidade = false,
}: ProtectedRouteProps) {
  const { user, loading, activeUnidade, vinculos } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireUnidade && !activeUnidade && vinculos.length > 0) {
    return <Navigate to="/select-unidade" replace />;
  }

  return <>{children}</>;
}
