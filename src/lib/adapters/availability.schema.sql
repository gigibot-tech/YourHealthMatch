-- Canonical availability table (Postgres / Supabase).
-- Wire by implementing AvailabilityStorePort against this schema.
-- RLS: doctors write their practice rows; patients read open offers.

create table if not exists availability_offers (
  id text primary key,
  practice_id text not null,
  doctor_id text not null,
  offer_date date not null,
  offer_time time not null,
  duration_min integer not null default 30,
  created_at timestamptz not null default now(),
  unique (practice_id, doctor_id, offer_date, offer_time)
);

create index if not exists availability_offers_practice_date_idx
  on availability_offers (practice_id, doctor_id, offer_date);
