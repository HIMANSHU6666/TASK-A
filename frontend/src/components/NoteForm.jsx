import { useState } from 'react';

const NoteForm = ({ onSubmit }) => {
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(text.trim());
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <textarea
          className="form-textarea"
          placeholder="Add a note… (e.g. called the prospect, follow-up scheduled for Friday)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Saving…' : '+ Add Note'}
        </button>
      </div>
    </form>
  );
};

export default NoteForm;
