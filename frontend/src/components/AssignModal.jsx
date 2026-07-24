import { useState, useEffect } from 'react';
import { usersAPI } from '../api';

const AssignModal = ({ lead, onClose, onAssign }) => {
  const [users, setUsers]     = useState([]);
  const [selected, setSelected] = useState(lead.assignedTo?._id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    usersAPI.list().then((r) => setUsers(r.data.data)).catch(() => setError('Failed to load users.'));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await onAssign(selected || null);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Assignment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Assign Lead</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Assign to</label>
          <select
            className="form-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignModal;
