-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists leaderboard (
  id          uuid        primary key default gen_random_uuid(),
  uid         text        unique not null,
  nickname    text        not null,
  city        text        not null check (city in ('Astana', 'Almaty', 'Other')),
  elo         integer     not null default 1200,
  wins        integer     not null default 0,
  losses      integer     not null default 0,
  draws       integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Allow anyone to read (public leaderboard)
alter table leaderboard enable row level security;
create policy "public read"  on leaderboard for select using (true);
create policy "public write" on leaderboard for insert with check (true);
create policy "public update" on leaderboard for update using (true);
