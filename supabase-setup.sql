-- Run this once in the Supabase SQL Editor before enabling the public form.
create extension if not exists pgcrypto;

create table if not exists public.preorder_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  edition_interest text not null check (edition_interest in ('collector', 'hardcover', 'paperback', 'starter-pack', 'updates')),
  source text not null check (source in ('preorder-form', 'starter-pack-form')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists preorder_leads_created_at_idx on public.preorder_leads (created_at desc);
create index if not exists preorder_leads_interest_idx on public.preorder_leads (edition_interest);

alter table public.preorder_leads enable row level security;
-- No public policies are required: the landing page calls Supabase only through the server using the service-role key.
