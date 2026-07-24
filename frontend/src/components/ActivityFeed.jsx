const ACTION_LABELS = {
  lead_created:   { icon: '✦', label: 'Lead submitted via capture form', color: 'var(--accent)' },
  status_changed: { icon: '⇄', label: (m) => `Status changed from "${m.from}" → "${m.to}"`, color: 'var(--s-qualified)' },
  assigned:       { icon: '→', label: (m) => m.to ? 'Lead assigned to a team member' : 'Lead unassigned', color: 'var(--s-contacted)' },
  unassigned:     { icon: '⊘', label: 'Lead unassigned', color: 'var(--text-3)' },
  note_added:     { icon: '✎', label: 'Note added', color: 'var(--s-proposal)' },
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ActivityFeed = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <div className="empty-icon">📋</div>
        <p style={{ fontSize: '0.85rem' }}>No activity yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {[...activities].reverse().map((a, i) => {
        const config = ACTION_LABELS[a.action] || { icon: '•', label: a.action, color: 'var(--text-3)' };
        const label  = typeof config.label === 'function' ? config.label(a.meta || {}) : config.label;

        return (
          <div key={a._id || i} style={{
            display: 'flex', gap: '0.85rem',
            padding: '0.85rem 0',
            borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
            animation: 'slideIn 0.2s ease',
          }}>
            {/* Timeline dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--surface-2)',
                border: `2px solid ${config.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: config.color, flexShrink: 0,
              }}>
                {config.icon}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {a.performedBy?.name && (
                  <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{a.performedBy.name}</span>
                )}
                <span>•</span>
                <span>{formatTime(a.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
