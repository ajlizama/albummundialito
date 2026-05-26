-- HOTFIX 001: column reference "invite_code"/"pool_id" is ambiguous
-- Re-crea las dos funciones RPC con referencias calificadas (pools.invite_code,
-- pool_members.pool_id) para que Postgres no las confunda con los OUT params.
--
-- Idempotente: puedes correr este archivo varias veces.

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
