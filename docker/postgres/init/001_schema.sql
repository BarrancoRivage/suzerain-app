-- Exécuté automatiquement par l'image postgres au premier démarrage
-- (tout fichier *.sql dans /docker-entrypoint-initdb.d/ est joué une fois,
-- tant que le volume de données est vide).

create table public.game_states (
  player_id   uuid        primary key,
  state       jsonb       not null,
  updated_at  timestamptz not null default now()
);

-- RLS activée pour rester iso avec la prod Supabase. Sans couche auth en
-- amont (Server Actions tapent en service role / superuser local), elle ne
-- gate rien aujourd'hui — sera utile à partir de la v0.3 (policies sur auth.uid()).
alter table public.game_states enable row level security;
