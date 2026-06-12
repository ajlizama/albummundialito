-- ============================================================================
-- AlbumMundialito - Pollas / Quinielas / Predictor
-- Migración aditiva. Idempotente: se puede correr varias veces.
-- Ejecutar DESPUÉS de schema.sql.
-- ============================================================================

-- ----------- 0) Flag de app-admin en profiles -----------
alter table public.profiles
  add column if not exists is_app_admin boolean not null default false;


-- ============================================================================
-- 1) pools (la polla)
--    Cada polla tiene reglas editables por su admin.
-- ============================================================================
create table if not exists public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  invite_code text not null unique,             -- código corto compartible
  created_by uuid references public.profiles(id) on delete set null,
  -- cobertura
  scope text not null default 'all'             -- 'all' | 'group_stage' | 'knockout' | 'custom'
    check (scope in ('all', 'group_stage', 'knockout', 'custom')),
  custom_match_nums int[] default null,
  -- ventana para enviar predicciones
  cutoff_minutes int not null default 10 check (cutoff_minutes between 0 and 240),
  -- puntos partido a partido (defaults estándar)
  pts_winner_group int not null default 5,
  pts_winner_ko int not null default 10,
  pts_goals_group int not null default 2,       -- por cada lado (max 2x)
  pts_goals_ko int not null default 4,
  pts_diff_group int not null default 1,
  pts_diff_ko int not null default 2,
  pts_exact_bonus_group int not null default 0, -- extra si marcador exacto
  pts_exact_bonus_ko int not null default 0,
  -- bonos opcionales (cada admin de polla los prende/apaga)
  bonus_champion_enabled boolean not null default true,
  bonus_champion_points int not null default 20,
  bonus_runner_up_enabled boolean not null default true,
  bonus_runner_up_points int not null default 10,
  bonus_semifinalists_enabled boolean not null default false,
  bonus_semifinalists_points int not null default 5,    -- por acierto
  bonus_top_scorer_enabled boolean not null default false,
  bonus_top_scorer_points int not null default 15,
  bonuses_locked_at timestamptz default null,           -- cierre de bonos (ej. antes del 1er partido)
  -- qué tiempo del partido cuenta para el marcador
  score_window text not null default 'regulation_only'
    check (score_window in ('regulation_only', 'with_extra_time', 'final_score')),
  -- meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pools_created_by_idx on public.pools(created_by);
create index if not exists pools_invite_code_idx on public.pools(invite_code);

alter table public.pools enable row level security;


-- ============================================================================
-- 2) pool_members
-- ============================================================================
create table if not exists public.pool_members (
  pool_id uuid references public.pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (pool_id, user_id)
);

create index if not exists pm_user_idx on public.pool_members(user_id);
create index if not exists pm_pool_idx on public.pool_members(pool_id);

alter table public.pool_members enable row level security;


-- ============================================================================
-- 3) pool_predictions (1 por user/match dentro de la polla)
-- ============================================================================
create table if not exists public.pool_predictions (
  pool_id uuid references public.pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_num int not null check (match_num between 1 and 104),
  home_goals int not null check (home_goals between 0 and 20),
  away_goals int not null check (away_goals between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (pool_id, user_id, match_num)
);

create index if not exists pp_pool_idx on public.pool_predictions(pool_id);
create index if not exists pp_pool_match_idx on public.pool_predictions(pool_id, match_num);
create index if not exists pp_pool_user_idx on public.pool_predictions(pool_id, user_id);

alter table public.pool_predictions enable row level security;


-- ============================================================================
-- 4) pool_bonus_predictions (1 por user/pool)
-- ============================================================================
create table if not exists public.pool_bonus_predictions (
  pool_id uuid references public.pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  champion_code text,
  runner_up_code text,
  semifinalist_codes text[],                    -- hasta 4 códigos
  top_scorer text,                              -- nombre libre
  updated_at timestamptz not null default now(),
  primary key (pool_id, user_id)
);

alter table public.pool_bonus_predictions enable row level security;


-- ============================================================================
-- 5) match_results (resultados oficiales del Mundial, globales)
-- ============================================================================
create table if not exists public.match_results (
  match_num int primary key check (match_num between 1 and 104),
  home_goals int not null check (home_goals between 0 and 20),
  away_goals int not null check (away_goals between 0 and 20),
  -- Para KO guardamos los tres marcadores: 90' reglamentarios, 120' (con prórroga) y
  -- el final (que incluye penales). Cada polla elige cuál usa según score_window.
  source text not null default 'manual' check (source in ('manual', 'auto')),
  manually_set boolean not null default false,  -- si true, cron no lo sobreescribe
  finished boolean not null default true,       -- el cron puede meter "live" partial
  recorded_at timestamptz not null default now()
);

alter table public.match_results enable row level security;


-- ============================================================================
-- 6) tournament_results (singleton, para bonos: campeón, top scorer, etc.)
-- ============================================================================
create table if not exists public.tournament_results (
  id boolean primary key default true check (id = true),
  champion_code text,
  runner_up_code text,
  semifinalist_codes text[],
  top_scorer text,
  updated_at timestamptz not null default now()
);

-- Asegurar fila singleton
insert into public.tournament_results (id) values (true) on conflict do nothing;

alter table public.tournament_results enable row level security;


-- ============================================================================
-- 7) match_schedule
--    Tabla con los kickoffs de los 104 partidos. Permite que las RLS sepan
--    si un partido ya arrancó (para mostrar pronósticos ajenos solo después).
--    Se popula vía pollas_hotfix_005.sql (con los 104 inserts del fixture).
-- ============================================================================
create table if not exists public.match_schedule (
  match_num int primary key check (match_num between 1 and 104),
  kickoff_at timestamptz not null
);

alter table public.match_schedule enable row level security;

drop policy if exists "ms_select_all" on public.match_schedule;
create policy "ms_select_all" on public.match_schedule for select using (true);


-- ============================================================================
-- HELPERS SECURITY DEFINER (evitan recursión en RLS de pool_members)
-- ============================================================================
create or replace function public.is_pool_member(p_pool uuid, p_user uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(select 1 from public.pool_members
    where pool_id = p_pool and user_id = p_user);
$$;

create or replace function public.is_pool_admin_of(p_pool uuid, p_user uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(select 1 from public.pool_members
    where pool_id = p_pool and user_id = p_user and role = 'admin');
$$;

grant execute on function public.is_pool_member(uuid, uuid) to authenticated;
grant execute on function public.is_pool_admin_of(uuid, uuid) to authenticated;

-- ¿Este partido ya arrancó? (usado por la RLS de pool_predictions)
create or replace function public.match_has_started(p_match_num int)
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce(
    (select now() >= kickoff_at from public.match_schedule where match_num = p_match_num),
    false
  );
$$;

grant execute on function public.match_has_started(int) to authenticated;


-- ============================================================================
-- RLS POLICIES (sin recursión — usan los helpers de arriba)
-- ============================================================================

-- pools
drop policy if exists "pools_select_member" on public.pools;
create policy "pools_select_member" on public.pools
  for select using (
    created_by = auth.uid()
    or public.is_pool_member(id, auth.uid())
  );

drop policy if exists "pools_insert_self" on public.pools;
create policy "pools_insert_self" on public.pools
  for insert with check (created_by = auth.uid());

drop policy if exists "pools_update_admin" on public.pools;
create policy "pools_update_admin" on public.pools
  for update using (public.is_pool_admin_of(id, auth.uid()));

drop policy if exists "pools_delete_admin" on public.pools;
create policy "pools_delete_admin" on public.pools
  for delete using (public.is_pool_admin_of(id, auth.uid()));

-- pool_members
drop policy if exists "pm_select" on public.pool_members;
create policy "pm_select" on public.pool_members
  for select using (
    user_id = auth.uid()
    or public.is_pool_member(pool_id, auth.uid())
  );

drop policy if exists "pm_insert_creator" on public.pool_members;
create policy "pm_insert_creator" on public.pool_members
  for insert with check (
    (user_id = auth.uid() and exists (
      select 1 from public.pools where id = pool_id and created_by = auth.uid()
    ))
    or public.is_pool_admin_of(pool_id, auth.uid())
  );

drop policy if exists "pm_delete_self_or_admin" on public.pool_members;
create policy "pm_delete_self_or_admin" on public.pool_members
  for delete using (
    user_id = auth.uid()
    or public.is_pool_admin_of(pool_id, auth.uid())
  );

-- pool_predictions: ves tus propios pronósticos siempre, y los ajenos solo
-- después de que el partido arrancó (para no copiar a tus amigos).
drop policy if exists "pp_select_members" on public.pool_predictions;
create policy "pp_select_members" on public.pool_predictions
  for select using (
    public.is_pool_member(pool_id, auth.uid())
    and (user_id = auth.uid() or public.match_has_started(match_num))
  );

drop policy if exists "pp_modify_own" on public.pool_predictions;
create policy "pp_modify_own" on public.pool_predictions
  for all using (
    user_id = auth.uid() and public.is_pool_member(pool_id, auth.uid())
  ) with check (
    user_id = auth.uid() and public.is_pool_member(pool_id, auth.uid())
  );

-- pool_bonus_predictions
drop policy if exists "pbp_select_members" on public.pool_bonus_predictions;
create policy "pbp_select_members" on public.pool_bonus_predictions
  for select using (public.is_pool_member(pool_id, auth.uid()));

drop policy if exists "pbp_modify_own" on public.pool_bonus_predictions;
create policy "pbp_modify_own" on public.pool_bonus_predictions
  for all using (
    user_id = auth.uid() and public.is_pool_member(pool_id, auth.uid())
  ) with check (
    user_id = auth.uid() and public.is_pool_member(pool_id, auth.uid())
  );

-- match_results: lectura pública (lo necesita el scoring); escritura solo app-admin.
drop policy if exists "mr_select_all" on public.match_results;
create policy "mr_select_all" on public.match_results
  for select using (true);

drop policy if exists "mr_modify_admin" on public.match_results;
create policy "mr_modify_admin" on public.match_results
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_app_admin = true)
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_app_admin = true)
  );

-- tournament_results: idem
drop policy if exists "tr_select_all" on public.tournament_results;
create policy "tr_select_all" on public.tournament_results
  for select using (true);

drop policy if exists "tr_modify_admin" on public.tournament_results;
create policy "tr_modify_admin" on public.tournament_results
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_app_admin = true)
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_app_admin = true)
  );


-- ============================================================================
-- RPCs
-- ============================================================================

-- Crear polla + meter al creador como admin en una sola transacción.
-- Genera un invite_code corto (8 chars base62) único.
create or replace function public.create_pool(
  p_name text,
  p_description text default null,
  p_scope text default 'all',
  p_custom_match_nums int[] default null
)
returns table (pool_id uuid, invite_code text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_pool_id uuid;
  v_code text;
  v_tries int := 0;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  if char_length(coalesce(p_name, '')) < 1 then raise exception 'nombre requerido'; end if;

  -- invite_code único
  loop
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (select 1 from public.pools p where p.invite_code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 5 then raise exception 'no se pudo generar invite_code'; end if;
  end loop;

  insert into public.pools (name, description, invite_code, created_by, scope, custom_match_nums)
  values (p_name, nullif(trim(coalesce(p_description, '')), ''), v_code, auth.uid(),
          coalesce(p_scope, 'all'), p_custom_match_nums)
  returning id into v_pool_id;

  insert into public.pool_members (pool_id, user_id, role)
  values (v_pool_id, auth.uid(), 'admin');

  pool_id := v_pool_id;
  invite_code := v_code;
  return next;
end;
$$;

grant execute on function public.create_pool(text, text, text, int[]) to authenticated;


-- Unirse a una polla por código (bypassa RLS de insert).
create or replace function public.join_pool_by_code(p_code text)
returns table (pool_id uuid, already_member boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_pool_id uuid;
  v_exists boolean;
  v_count int;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  select p.id into v_pool_id
    from public.pools p
    where p.invite_code = upper(trim(coalesce(p_code, '')))
    limit 1;
  if v_pool_id is null then raise exception 'código inválido'; end if;

  select exists (
    select 1 from public.pool_members pm
    where pm.pool_id = v_pool_id and pm.user_id = auth.uid()
  ) into v_exists;

  if v_exists then
    pool_id := v_pool_id;
    already_member := true;
    return next;
    return;
  end if;

  -- Límite de 100 participantes por polla
  select count(*) into v_count
    from public.pool_members pm
    where pm.pool_id = v_pool_id;
  if v_count >= 100 then
    raise exception 'la polla está llena (100 participantes)';
  end if;

  insert into public.pool_members (pool_id, user_id, role)
  values (v_pool_id, auth.uid(), 'member');

  pool_id := v_pool_id;
  already_member := false;
  return next;
end;
$$;

grant execute on function public.join_pool_by_code(text) to authenticated;
