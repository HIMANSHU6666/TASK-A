import { useState } from 'react';
import { leadsAPI } from '../api';

const CapturePage = () => {
  const [form, setForm]       = useState({ name: '', email: '', company: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await leadsAPI.create(form);
      setSuccess(true);
      setForm({ name: '', email: '', company: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1424 0%, #0a0f1e 60%, #0f1730 100%)',
        padding: '4rem 1.5rem 5rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 500, height: 200,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 99, padding: '0.3rem 1rem',
          fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)',
          marginBottom: '1.25rem',
        }}>
          ✦ Now Open for Demo Access
        </div>

        <h1 style={{ marginBottom: '0.75rem', maxWidth: 560, margin: '0 auto 0.75rem' }}>
          Close more deals.<br />
          <span style={{ color: 'var(--accent)' }}>Less admin. More pipeline.</span>
        </h1>
        <p style={{ color: 'var(--text-2)', maxWidth: 460, margin: '0 auto', fontSize: '1rem' }}>
          LeadOS helps your sales team track every prospect from first touch to closed deal.
        </p>
      </div>

      {/* Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {success ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
              <h2 style={{ marginBottom: '0.5rem' }}>We got it!</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem' }}>
                Thanks for reaching out. Our team will be in touch within 24 hours.
              </p>
              <button className="btn btn-ghost" onClick={() => setSuccess(false)}>
                Submit another
              </button>
            </div>
          ) : (
            <div className="card">
              <h2 style={{ marginBottom: '0.25rem' }}>Get in touch</h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Tell us about your team and we'll reach out to set you up.
              </p>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full name *</label>
                  <input
                    id="cap-name"
                    className="form-input"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Sarah Mitchell"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Work email *</label>
                  <input
                    id="cap-email"
                    className="form-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="sarah@company.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    id="cap-company"
                    className="form-input"
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">How can we help?</label>
                  <textarea
                    id="cap-message"
                    className="form-textarea"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your team size and what you're looking for…"
                    rows={3}
                  />
                </div>

                <button
                  id="cap-submit"
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  {loading ? 'Sending…' : 'Send message →'}
                </button>
              </form>

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <a href="/login" style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                  Team member? <span style={{ color: 'var(--accent)' }}>Sign in</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <a href="https://digitalheroes.com" target="_blank" rel="noopener noreferrer">
          Built for Digital Heroes Training Task
        </a>
      </footer>
    </div>
  );
};

export default CapturePage;
