import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo credential quick-fill
  const fillDemo = (role) => {
    if (role === 'admin')  setForm({ email: 'admin@demo.com',  password: 'Admin@1234' });
    if (role === 'member') setForm({ email: 'member@demo.com', password: 'Member@1234' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 44, height: 44,
            background: 'var(--accent)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 800, color: '#fff',
            margin: '0 auto 0.75rem',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}>L</div>
          <h1 style={{ fontSize: '1.5rem' }}>Sign in to LeadOS</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Manage your pipeline from one place
          </p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              id="login-submit"
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', marginTop: '0.25rem' }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-2)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Demo accounts
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                id="demo-admin"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1 }}
                onClick={() => fillDemo('admin')}
                type="button"
              >
                👑 Admin
              </button>
              <button
                id="demo-member"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1 }}
                onClick={() => fillDemo('member')}
                type="button"
              >
                👤 Member
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-3)' }}>
          Looking for the public form?{' '}
          <Link to="/" style={{ color: 'var(--accent)' }}>Submit a lead</Link>
        </p>
      </div>

      <footer style={{ position: 'fixed', bottom: '1rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
        <a href="https://digitalheroesco.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-3)' }}>
          Built for Digital Heroes Training Task
        </a>
      </footer>
    </div>
  );
};

export default LoginPage;
