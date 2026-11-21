-- Run this SQL once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  purchase_price numeric(12,2) not null default 0,
  profit_type text not null check (profit_type in ('amount','percent')),
  profit_value numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  stock numeric(12,3) not null default 0,
  low_stock numeric(12,3) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  items jsonb not null,
  total numeric(12,2) not null default 0,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
-- All database access goes through server.js using the Supabase service-role key.
-- Do not put the service-role key in browser JavaScript.
