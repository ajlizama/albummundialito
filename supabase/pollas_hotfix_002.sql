-- HOTFIX 002: "infinite recursion detected in policy for relation pool_members"
--
-- Causa: la policy pm_select hacía un EXISTS sobre pool_members, lo que reactiva
-- la misma policy → recursión infinita. Lo mismo en pm_insert_creator/pm_delete
-- y en cualquier policy que consulte pool_members.
--
-- Fix: dos funciones SECURITY DEFINER (corren como postgres, bypaseando RLS)
-- para checkear membership. Las policies usan estas funciones en vez de EXISTS.
--
-- Idempotente: puede correrse varias veces.

-- ---------- 1) Helpers SECURITY DEFINER ----------
create or replace function public.is_pool_member(p_pool uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.pool_members
    where pool_id = p_pool and user_id = p_user
  );
$$;

create or replace function public.is_pool_admin_of(p_pool uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.pool_members
    where pool_id = p_pool and user_id = p_user and role = 'admin'
  );
$$;

grant execute on function public.is_pool_member(uuid, uuid) to authenticated;
grant execute on function public.is_pool_admin_of(uuid, uuid) to authenticated;


-- ---------- 2) Reescribir policies sin recursión ----------

-- pools: ver si soy creador o miembro
drop policy if exists "pools_select_member" on public.pools;
create policy "pools_select_member" on public.pools
  for select using (
    created_by = auth.uid()
    or public.is_pool_member(id, auth.uid())
  );

drop policy if exists "pools_update_admin" on public.pools;
create policy "pools_update_admin" on public.pools
  for update using (public.is_pool_admin_of(id, auth.uid()));

drop policy if exists "pools_delete_admin" on public.pools;
create policy "pools_delete_admin" on public.pools
  for delete using (public.is_pool_admin_of(id, auth.uid()));

-- pool_members: SELECT propio o de la misma polla
drop policy if exists "pm_select" on public.pool_members;
create policy "pm_select" on public.pool_members
  for select using (
    user_id = auth.uid()
    or public.is_pool_member(pool_id, auth.uid())
  );

-- INSERT: creador del pool o admin existente
drop policy if exists "pm_insert_creator" on public.pool_members;
create policy "pm_insert_creator" on public.pool_members
  for insert with check (
    (user_id = auth.uid() and exists (
      select 1 from public.pools where id = pool_id and created_by = auth.uid()
    ))
    or public.is_pool_admin_of(pool_id, auth.uid())
  );

-- DELETE: uno mismo o admin
drop policy if exists "pm_delete_self_or_admin" on public.pool_members;
create policy "pm_delete_self_or_admin" on public.pool_members
  for delete using (
    user_id = auth.uid()
    or public.is_pool_admin_of(pool_id, auth.uid())
  );

-- pool_predictions: lectura para cualquier miembro; modificación propio
drop policy if exists "pp_select_members" on public.pool_predictions;
create policy "pp_select_members" on public.pool_predictions
  for select using (public.is_pool_member(pool_id, auth.uid()));

drop policy if exists "pp_modify_own" on public.pool_predictions;
create policy "pp_modify_own" on public.pool_predictions
  for all using (
    user_id = auth.uid() and public.is_pool_member(pool_id, auth.uid())
  ) with check (
    user_id = auth.uid() and public.is_pool_member(pool_id, auth.uid())
  );

-- pool_bonus_predictions: igual
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
