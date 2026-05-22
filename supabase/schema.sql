-- ============================================================================
-- AlbumMundialito - Supabase schema
-- Ejecutar en el SQL Editor del proyecto. Idempotente: puedes correrlo
-- varias veces sin problema.
-- ============================================================================

-- ----------- 1) profiles -----------
-- Un profile por user (1:1 con auth.users). El username es publico.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_color text default '#7a1239',
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);


-- ----------- 2) friendships -----------
-- requester envia la solicitud, addressee la acepta/rechaza
-- Tiene que ir antes de las policies de collection porque las RLS la referencian.
do $$ begin
  create type public.friendship_status as enum ('pending', 'accepted', 'declined');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status public.friendship_status not null default 'pending',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_participant" on public.friendships;
create policy "friendships_select_participant" on public.friendships
  for select using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "friendships_insert_as_requester" on public.friendships;
create policy "friendships_insert_as_requester" on public.friendships
  for insert with check (auth.uid() = requester_id);

drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee" on public.friendships
  for update using (auth.uid() = addressee_id);

drop policy if exists "friendships_delete_participant" on public.friendships;
create policy "friendships_delete_participant" on public.friendships
  for delete using (auth.uid() in (requester_id, addressee_id));


-- ----------- 3) collection -----------
-- Cada fila es una lamina marcada por un user.
-- count >= 1 significa "tengo". count > 1 significa "tengo repetidas".
create table if not exists public.collection (
  user_id uuid references public.profiles(id) on delete cascade not null,
  sticker_id text not null,
  count int not null default 1 check (count >= 0),
  updated_at timestamptz default now() not null,
  primary key (user_id, sticker_id)
);

create index if not exists collection_user_idx on public.collection(user_id);
create index if not exists collection_sticker_idx on public.collection(sticker_id);

alter table public.collection enable row level security;

drop policy if exists "collection_select_friends_or_self" on public.collection;
create policy "collection_select_friends_or_self" on public.collection
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.friendships
      where status = 'accepted'
      and ((requester_id = auth.uid() and addressee_id = collection.user_id)
        or (addressee_id = auth.uid() and requester_id = collection.user_id))
    )
  );

drop policy if exists "collection_modify_own" on public.collection;
create policy "collection_modify_own" on public.collection
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ----------- 4) trigger: al crear un user, crear su profile -----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  candidate text;
  i int := 0;
begin
  base_username := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g');
  if base_username = '' or base_username is null then
    base_username := 'user';
  end if;
  candidate := base_username;
  while exists(select 1 from public.profiles where username = candidate) loop
    i := i + 1;
    candidate := base_username || i;
  end loop;
  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'display_name', candidate));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================================
-- 5) groups + group_members
--    Permite que varios usuarios formen un grupo para comparar progreso.
--    Entrar al grupo: invite por username (con accept/decline) o por link (token).
--    Visibilidad: una vez accepted, ves la colección de los demás miembros.
-- ============================================================================
do $$ begin
  create type public.group_member_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null;
end $$;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  invite_token uuid not null default gen_random_uuid() unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists groups_invite_token_idx on public.groups(invite_token);

create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status public.group_member_status not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  primary key (group_id, user_id)
);

create index if not exists gm_user_idx on public.group_members(user_id);
create index if not exists gm_group_idx on public.group_members(group_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- ----- groups RLS -----
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member" on public.groups
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

drop policy if exists "groups_insert_self" on public.groups;
create policy "groups_insert_self" on public.groups
  for insert with check (created_by = auth.uid());

drop policy if exists "groups_update_admin" on public.groups;
create policy "groups_update_admin" on public.groups
  for update using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
      and role = 'admin' and status = 'accepted'
    )
  );

drop policy if exists "groups_delete_admin" on public.groups;
create policy "groups_delete_admin" on public.groups
  for delete using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
      and role = 'admin' and status = 'accepted'
    )
  );

-- ----- group_members RLS -----
-- SELECT: cualquier miembro (incluso pendiente) ve la fila propia,
-- y los aceptados ven a todos los miembros del grupo.
drop policy if exists "gm_select" on public.group_members;
create policy "gm_select" on public.group_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members me
      where me.group_id = group_members.group_id
      and me.user_id = auth.uid()
      and me.status = 'accepted'
    )
  );

-- INSERT: (a) el creador se mete a sí mismo como admin/accepted;
--          (b) un admin existente invita a alguien.
-- (NO permitimos self-insert por link aquí; eso pasa por la función SECURITY DEFINER.)
drop policy if exists "gm_insert" on public.group_members;
create policy "gm_insert" on public.group_members
  for insert with check (
    (user_id = auth.uid() and exists (
      select 1 from public.groups where id = group_id and created_by = auth.uid()
    ))
    or exists (
      select 1 from public.group_members
      where group_id = group_members.group_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'accepted'
    )
  );

-- UPDATE: uno mismo acepta/declina su invitación; admins pueden cambiar role.
drop policy if exists "gm_update_self_or_admin" on public.group_members;
create policy "gm_update_self_or_admin" on public.group_members
  for update using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_id = group_members.group_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'accepted'
    )
  );

-- DELETE: uno mismo se sale; admin saca a otro.
drop policy if exists "gm_delete" on public.group_members;
create policy "gm_delete" on public.group_members
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_id = group_members.group_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'accepted'
    )
  );


-- ----- Función SECURITY DEFINER para join por link -----
-- El RLS de gm_insert no deja self-insert (excepto creador). Esta función bypasea
-- ese check después de validar que el token sea válido.
create or replace function public.join_group_by_token(p_token uuid)
returns table (group_id uuid, already_member boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_group_id uuid;
  v_existing public.group_member_status;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  select id into v_group_id from public.groups where invite_token = p_token limit 1;
  if v_group_id is null then raise exception 'token inválido'; end if;
  select status into v_existing from public.group_members
    where group_id = v_group_id and user_id = auth.uid();

  if v_existing = 'accepted' then
    group_id := v_group_id;
    already_member := true;
    return next;
    return;
  end if;

  if v_existing is null then
    insert into public.group_members (group_id, user_id, status, role)
    values (v_group_id, auth.uid(), 'accepted', 'member');
  else
    update public.group_members
      set status = 'accepted', updated_at = now()
      where group_id = v_group_id and user_id = auth.uid();
  end if;

  group_id := v_group_id;
  already_member := false;
  return next;
end;
$$;

grant execute on function public.join_group_by_token(uuid) to authenticated;


-- ============================================================================
-- 6) UPDATE collection RLS: amigos OR compañeros de grupo pueden leerme
-- ============================================================================
drop policy if exists "collection_select_friends_or_self" on public.collection;
drop policy if exists "collection_select_friends_or_group" on public.collection;
create policy "collection_select_friends_or_group" on public.collection
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.friendships
      where status = 'accepted'
      and ((requester_id = auth.uid() and addressee_id = collection.user_id)
        or (addressee_id = auth.uid() and requester_id = collection.user_id))
    )
    or exists (
      select 1 from public.group_members me
      join public.group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and me.status = 'accepted'
      and them.user_id = collection.user_id and them.status = 'accepted'
    )
  );
