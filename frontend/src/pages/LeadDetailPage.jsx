import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import ActivityFeed from '../components/ActivityFeed';
import AssignModal from '../components/AssignModal';
import NoteForm from '../components/NoteForm';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const formatDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const LeadDetailPage = () => {
  const { id }                       = useParams();
  const navigate                     = useNavigate();
  const { isAdmin }                  = useAuth();
  const [lead, setLead]              = useState(null);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState('');
  const [showAssign, setShowAssign]  = useState(false);
  const [activeTab, setActiveTab]    = useState('notes'); // 'notes' | 'activity'

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await leadsAPI.get(id);
      setLead(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load lead.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLead(); }, [id]);

  const handleStatusChange = async (status) => {
    try {
      const res = await leadsAPI.updateStatus(id, status);
      setLead(res.data.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleAssign = async (userId) => {
    const res = await leadsAPI.assign(id, userId);
    setLead(res.data.data);
  };

  const handleAddNote = async (text) => {
    const res = await leadsAPI.addNote(id, text);
    setLead(res.data.data);
  };

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <div className="spinner-wrap"><div className="spinner" /></div>
    </div>
  );

  if (error || !lead) return (
    <div className="app-shell">
      <Navbar />
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)' }}>{error || 'Lead not found.'}</p>
        <button className="btn btn-ghost btn-sm mt-4" onClick={() => navigate('/dashboard')}>← Back</button>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar />

      <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div className="page-container">
          {/* Back */}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: '1.25rem' }}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to pipeline
          </button>

          {/* Lead header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem' }}>{lead.name}</h1>
                <StatusBadge status={lead.status} />
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                {lead.email}
                {lead.company && <span style={{ color: 'var(--text-3)' }}> · {lead.company}</span>}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.4rem' }}>
                Submitted {formatDate(lead.createdAt)}
              </div>
            </div>

            {/* Admin actions */}
            {isAdmin() && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssign(true)}>
                {lead.assignedTo ? `Assigned: ${lead.assignedTo.name}` : '+ Assign'} ↓
              </button>
            )}
          </div>

          {/* Message */}
          {lead.message && (
            <div className="card-sm" style={{ marginBottom: '1.5rem', color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.7 }}>
              "{lead.message}"
            </div>
          )}

          {/* Status pipeline */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pipeline Stage
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => s !== lead.status && handleStatusChange(s)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 99,
                    border: `1px solid ${s === lead.status ? 'var(--accent)' : 'var(--border)'}`,
                    background: s === lead.status ? 'var(--accent-dim)' : 'transparent',
                    color: s === lead.status ? 'var(--accent)' : 'var(--text-3)',
                    cursor: s === lead.status ? 'default' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: s === lead.status ? 600 : 400,
                    transition: 'all 0.15s ease',
                    textTransform: 'capitalize',
                  }}
                >
                  {s === lead.status && '✓ '}{s}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs: Notes + Activity */}
          <div className="card">
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              {['notes', 'activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.6rem 1rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: 600,
                    color: activeTab === tab ? 'var(--accent)' : 'var(--text-3)',
                    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: '-1px',
                    textTransform: 'capitalize',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {tab === 'notes' ? `Notes (${lead.notes?.length || 0})` : `Activity (${lead.activity?.length || 0})`}
                </button>
              ))}
            </div>

            {activeTab === 'notes' && (
              <div>
                {/* Add note */}
                <NoteForm onSubmit={handleAddNote} />

                {/* Notes list */}
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[...(lead.notes || [])].reverse().map((note, i) => (
                    <div
                      key={note._id || i}
                      style={{
                        padding: '0.9rem',
                        background: 'var(--bg-2)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{note.text}</p>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-3)', marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{note.createdBy?.name || 'Team'}</span>
                        <span>·</span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  {(!lead.notes || lead.notes.length === 0) && (
                    <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
                      No notes yet. Add the first one above.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <ActivityFeed activities={lead.activity || []} />
            )}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <a href="https://digitalheroesco.com/" target="_blank" rel="noopener noreferrer">
          Built for Digital Heroes Training Task
        </a>
      </footer>

      {/* Assign modal — admin only */}
      {showAssign && (
        <AssignModal
          lead={lead}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
};

export default LeadDetailPage;
