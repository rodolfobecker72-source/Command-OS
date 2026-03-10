import { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const LOADING_TIMEOUT_MS = 10_000;

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  const [forceRender, setForceRender] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading && !forceRender) {
      timerRef.current = setTimeout(() => {
        console.warn('[ProtectedRoute] Safety timeout: forcing render after 10s of loading');
        setForceRender(true);
      }, LOADING_TIMEOUT_MS);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!isLoading && forceRender) {
        setForceRender(false);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, forceRender]);

  if (isLoading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
