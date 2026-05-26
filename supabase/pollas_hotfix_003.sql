-- HOTFIX 003: Agregar score_window configurable a pools
-- Define qué tiempo del partido cuenta para el marcador en esta polla.
-- Solo afecta el texto informativo — el admin de la app ingresa el marcador
-- de match_results según esta regla.

alter table public.pools
  add column if not exists score_window text not null default 'regulation_only'
    check (score_window in ('regulation_only', 'with_extra_time', 'final_score'));
