-- GlucoAI Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  diabetes_type text not null default 'type1' check (diabetes_type in ('type1', 'type2', 'gestational', 'prediabetes')),
  carb_ratio numeric(6,2) not null default 15,
  correction_factor numeric(6,2) not null default 50,
  target_glucose numeric(6,2) not null default 100,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Meal Scans ────────────────────────────────────────────────────────────────
create table if not exists public.meal_scans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  image_url text,
  food_name text not null,
  calories numeric(8,2) not null default 0,
  carbohydrates numeric(8,2) not null default 0,
  sugar numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  fats numeric(8,2) not null default 0,
  glycemic_index numeric(5,2) not null default 0,
  insulin_dose numeric(6,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.meal_scans enable row level security;

create policy "Users can manage own meal scans"
  on public.meal_scans for all using (auth.uid() = user_id);

create index on public.meal_scans (user_id, created_at desc);

-- ── Glucose Logs ──────────────────────────────────────────────────────────────
create table if not exists public.glucose_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  value numeric(6,2) not null,
  unit text not null default 'mg/dL' check (unit in ('mg/dL', 'mmol/L')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.glucose_logs enable row level security;

create policy "Users can manage own glucose logs"
  on public.glucose_logs for all using (auth.uid() = user_id);

create index on public.glucose_logs (user_id, created_at desc);

-- ── Chat History ──────────────────────────────────────────────────────────────
create table if not exists public.chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_history enable row level security;

create policy "Users can manage own chat history"
  on public.chat_history for all using (auth.uid() = user_id);

create index on public.chat_history (user_id, created_at asc);

-- ── Storage buckets ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', true)
on conflict do nothing;

create policy "Users can upload meal images"
  on storage.objects for insert
  with check (bucket_id = 'meal-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Meal images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'meal-images');

create policy "Users can delete own meal images"
  on storage.objects for delete
  using (bucket_id = 'meal-images' and auth.uid()::text = (storage.foldername(name))[1]);
