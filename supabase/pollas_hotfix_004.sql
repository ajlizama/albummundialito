-- HOTFIX 004: match_results soporta tres marcadores para que score_window funcione
--
-- Las columnas viejas (home_goals/away_goals) se mantienen como "regulation"
-- (90'). Agregamos los marcadores extendidos para prórroga y penales.
-- El scoring elige qué columnas usar según pool.score_window.
--
-- Idempotente.

alter table public.match_results
  add column if not exists home_goals_et int check (home_goals_et is null or home_goals_et between 0 and 20),
  add column if not exists away_goals_et int check (away_goals_et is null or away_goals_et between 0 and 20),
  add column if not exists home_goals_final int check (home_goals_final is null or home_goals_final between 0 and 20),
  add column if not exists away_goals_final int check (away_goals_final is null or away_goals_final between 0 and 20),
  add column if not exists went_to_extra_time boolean not null default false,
  add column if not exists went_to_penalties boolean not null default false;

-- Comentarios sobre semántica:
--   home_goals / away_goals     → marcador a los 90' reglamentarios (siempre llenos)
--   home_goals_et / away_goals_et → marcador a los 120' (solo KO con prórroga)
--   home_goals_final / away_goals_final → marcador final, incluye desempate por penales
-- Si no hubo prórroga, _et y _final = el de 90'. Si no hubo penales, _final = _et.
-- El scoring elige la pareja correcta según pool.score_window.
