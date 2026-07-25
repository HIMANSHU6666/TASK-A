import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const STAT_COLORS = {
  new: 'var(--s-new)', contacted: 'var(--s-contacted)',
  qualified: 'var(--s-qualified)', proposal: 'var(--s-proposal)',
  won: 'var(--s-won)', lost: 'var(--s-lost)',
};

const DashboardPage = () => {
  const { user, isAdmin }      = useAuth();
  const navigate               = useNavigate();
  const [leads, setLeads]      = useState([]);
  const [pagination, setPag]   = useState({});
  const [loading, setLoading]  = useState(true);
  const [filter, setFilter]    = useState({ status: '', search: '', page: 1 });
  const [stats, setStats]      = useState({});

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filter.page, limit: 10 };
      if (filter.status) params.status = filter.status;
      if (filter.search) params.search = filter.search;
      const res = await leadsAPI.list(params);
      setLeads(res.data.data);
      setPag(res.data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch status stats for admin
  const fetchStats = useCallback(async () => {
    if (!isAdmin()) return;
    try {
      const statuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
      const counts = await Promise.all(statuses.map((s) => leadsAPI.list({ status: s, limit: 1 })));
      const s = {};
      statuses.forEach((st, i) => { s[st] = counts[i].data.pagination.total; });
      setStats(s);
    } catch (e) { /* silent */ }
  }, [isAdmin]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="app-shell">
      <Navbar />

      <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div className="page-container">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 style={{ fontSize: '1.5rem' }}>
                {isAdmin() ? 'All Leads' : 'My Assigned Leads'}
              </h1>
              <p className="text-muted text-sm mt-1">
                {isAdmin()
                  ? `Welcome back, ${user?.name}. Here's your full pipeline.`
                  : `Showing leads assigned to you, ${user?.name}.`}
              </p>
            </div>
          </div>

          {/* Stats row — admin only */}
          {isAdmin() && Object.keys(stats).length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              {Object.entries(stats).map(([st, count]) => (
                <div
                  key={st}
                  className="card-sm"
                  style={{ cursor: 'pointer', borderColor: filter.status === st ? STAT_COLORS[st] : 'var(--border)' }}
                  onClick={() => setFilter((f) => ({ ...f, status: f.status === st ? '' : st, page: 1 }))}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: STAT_COLORS[st] }}>{count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'capitalize', marginTop: '0.15rem' }}>{st}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              style={{ maxWidth: 260 }}
              placeholder="Search name, email, company…"
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
            <select
              className="form-select"
              style={{ maxWidth: 170 }}
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value, page: 1 }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s === 'all' ? '' : s}>
                  {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : leads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No leads found</h3>
              <p>Try adjusting your filters, or wait for new submissions.</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Assigned to</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id} onClick={() => navigate(`/leads/${lead._id}`)}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{lead.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{lead.email}</div>
                        </td>
                        <td style={{ color: 'var(--text-2)' }}>{lead.company || '—'}</td>
                        <td><StatusBadge status={lead.status} /></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                          {lead.assignedTo?.name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{formatDate(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
                  >← Prev</button>
                  <span className="text-sm text-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
                  >Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <a href="https://digitalheroesco.com/" target="_blank" rel="noopener noreferrer">
          Built for Digital Heroes Training Task
        </a>
      </footer>
    </div>
  );
};

export default DashboardPage;
