import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMe } from '../api/hooks';

export function Layout({ children }: { children: ReactNode }) {
  const { isAuthed, orgId, setOrg, logout } = useAuth();
  const { data: me } = useMe(isAuthed);

  // Default the active org to the first membership if none chosen yet.
  useEffect(() => {
    if (!orgId && me?.organizations.length) {
      setOrg(me.organizations[0].org._id);
    }
  }, [orgId, me, setOrg]);

  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">
          Orbit
        </Link>
        <div className="spacer" />
        {me && me.organizations.length > 0 && (
          <select value={orgId ?? ''} onChange={(e) => setOrg(e.target.value)}>
            {me.organizations.map((m) => (
              <option key={m.org._id} value={m.org._id}>
                {m.org.name} ({m.role})
              </option>
            ))}
          </select>
        )}
        <button className="ghost" onClick={() => logout()}>
          Sign out
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}
