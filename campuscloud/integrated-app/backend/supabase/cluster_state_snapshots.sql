create table if not exists public.cluster_state_snapshots (
  instance_key text primary key,
  snapshot jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists cluster_state_snapshots_updated_at_idx
  on public.cluster_state_snapshots (updated_at desc);
