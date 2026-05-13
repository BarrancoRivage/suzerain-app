// Placeholder pour la couche authentification.
// Sera implémenté en v0.3 via Supabase Auth (magic link email).
// Migrera lib/session.ts (cookie anonyme) vers `auth.uid()` Supabase,
// puis activera une RLS policy `player_id = auth.uid()` sur game_states.

export {};
