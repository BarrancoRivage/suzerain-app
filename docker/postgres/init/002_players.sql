-- Exécuté automatiquement par l'image postgres au premier démarrage
-- (tout fichier *.sql dans /docker-entrypoint-initdb.d/ est joué une fois,
-- tant que le volume de données est vide). Sur un volume existant, le pg
-- backend (lib/db/pg.ts) recrée la table à la volée via `create table if
-- not exists`. En prod Supabase, jouer ce corps SQL une fois à la main.

create table public.players (
  player_id   uuid        primary key,
  name        text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS activée pour rester iso avec la prod Supabase. Sans couche auth en
-- amont (Server Actions tapent en service role / superuser local), elle ne
-- gate rien aujourd'hui — sera utile à partir de la v0.3 (policies sur auth.uid()).
alter table public.players enable row level security;

create index players_name_idx on public.players (lower(name));
