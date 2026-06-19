import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch {
      setError('Could not create account (email may already be in use)');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={onSubmit}>
        <h1>Create your Orbit workspace</h1>
        {error && <p className="error">{error}</p>}
        <input placeholder="Your name" value={form.name} onChange={update('name')} />
        <input placeholder="Email" value={form.email} onChange={update('email')} />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={update('password')}
        />
        <input
          placeholder="Organization name"
          value={form.orgName}
          onChange={update('orgName')}
        />
        <button disabled={busy}>{busy ? 'Creating…' : 'Create workspace'}</button>
        <p className="muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
