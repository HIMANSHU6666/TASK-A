const STATUS_CONFIG = {
  new:       { label: 'New',       dot: '●' },
  contacted: { label: 'Contacted', dot: '●' },
  qualified: { label: 'Qualified', dot: '●' },
  proposal:  { label: 'Proposal',  dot: '●' },
  won:       { label: 'Won',       dot: '✓' },
  lost:      { label: 'Lost',      dot: '✕' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, dot: '●' };
  return (
    <span className={`badge badge-${status}`}>
      <span style={{ fontSize: '0.6rem' }}>{config.dot}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
