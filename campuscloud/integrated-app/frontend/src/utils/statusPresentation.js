const STATUS_LABELS = {
  queued: 'Queued',
  assigned: 'Assigned',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  interrupted: 'Interrupted',
  offline: 'Offline',
  idle: 'Idle',
  busy: 'Busy',
};

const STATUS_CLASSES = {
  queued: 'bg-slate-700 text-slate-200',
  assigned: 'bg-cyan-500/15 text-cyan-300',
  running: 'bg-amber-500/15 text-amber-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  failed: 'bg-rose-500/15 text-rose-300',
  interrupted: 'bg-orange-500/15 text-orange-300',
  offline: 'bg-slate-700 text-slate-300',
  idle: 'bg-emerald-500/15 text-emerald-300',
  busy: 'bg-amber-500/15 text-amber-300',
};

function getReadableStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return STATUS_LABELS[normalized] || normalized || 'Unknown';
}

function getStatusBadgeClass(status, fallback = 'bg-slate-700 text-slate-200') {
  const normalized = String(status || '').trim().toLowerCase();
  return STATUS_CLASSES[normalized] || fallback;
}

export { getReadableStatus, getStatusBadgeClass };
