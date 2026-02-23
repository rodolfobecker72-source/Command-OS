import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PageGuardProps {
  pageKey: string;
  children: React.ReactNode;
}

export function PageGuard({ pageKey, children }: PageGuardProps) {
  const { hasPageAccess } = useAuth();

  if (!hasPageAccess(pageKey)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
