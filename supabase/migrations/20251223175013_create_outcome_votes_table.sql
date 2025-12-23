-- Create outcome_votes table
create table if not exists public.outcome_votes (
    id uuid not null default gen_random_uuid(),
    outcome_id uuid not null references public.outcomes(id) on delete cascade,
    vote_type text not null check (vote_type in ('up', 'down')),
    session_id text not null,
    created_at timestamp with time zone default now(),
    constraint outcome_votes_pkey primary key (id)
);

-- Enable RLS
alter table public.outcome_votes enable row level security;

-- Create policies

-- Allow anonymous users to insert votes
create policy "Enable insert for anonymous users"
    on public.outcome_votes
    for insert
    to anon
    with check (true);

-- Allow anonymous users to view votes (for potential future counts)
create policy "Enable select for anonymous users"
    on public.outcome_votes
    for select
    to anon
    using (true);

-- Indexes
create index outcome_votes_outcome_id_idx on public.outcome_votes (outcome_id);
create index outcome_votes_session_id_idx on public.outcome_votes (session_id);
