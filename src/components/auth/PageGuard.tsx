import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PageGuardProps {
  pageKey: string;
  children: React.ReactNode;
}

export function PageGuard({ pageKey, children }: PageGuardProps) {
  const { hasPageAccess, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasPageAccess(pageKey)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
