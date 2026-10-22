-- TokenvaCash: persistent authentication and transfer ownership.
-- All operations on these tables must be performed by trusted server code.

create table if not exists public.wallet_auth_challenges (
  nonce text primary key,
  wallet_address text not null,
  message text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wallet_auth_challenges_expiry_idx
  on public.wallet_auth_challenges (expires_at);

create table if not exists public.wallet_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  wallet_address text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wallet_sessions_wallet_idx
  on public.wallet_sessions (wallet_address);

create index if not exists wallet_sessions_expiry_idx
  on public.wallet_sessions (expires_at);

create table if not exists public.transfer_ownership (
  transfer_id text primary key,
  wallet_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists transfer_ownership_wallet_idx
  on public.transfer_ownership (wallet_address);

-- These tables are accessed through trusted server-side code only.
alter table public.wallet_auth_challenges enable row level security;
alter table public.wallet_sessions enable row level security;
alter table public.transfer_ownership enable row level security;

revoke all on public.wallet_auth_challenges from anon, authenticated;
revoke all on public.wallet_sessions from anon, authenticated;
revoke all on public.transfer_ownership from anon, authenticated;

-- Remove expired challenges and sessions periodically from server-side cleanup.
-- Do not grant browser clients direct access to these records.
