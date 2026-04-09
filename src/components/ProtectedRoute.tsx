import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, profile, vinculos } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hasRequiredRole = !requiredRole || vinculos.some(v => v.role === requiredRole);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    if (
      profile?.senha_temporaria === true &&
      location.pathname !== '/alterar-senha'
    ) {
      navigate('/alterar-senha');
      return;
    }

    if (requiredRole && !hasRequiredRole) {
      navigate('/');
    }
  }, [user, loading, profile, location.pathname, navigate, hasRequiredRole, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profile?.senha_temporaria === true && location.pathname !== '/alterar-senha') {
    return null;
  }

  if (requiredRole && !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
};
