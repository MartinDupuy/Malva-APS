export function StatusPill({ status }) {
  const label = status === 'CANCELLED' ? 'Cancelado' : 'Activo';
  return <span className={`status-pill status-${status.toLowerCase()}`}>{label}</span>;
}
