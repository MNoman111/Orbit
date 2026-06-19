import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthed, ready } = useAuth();
  if (!ready) return <div className="center">Loading…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
