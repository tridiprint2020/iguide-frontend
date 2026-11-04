-- Review in the selected project before applying. Creates no user accounts.
begin;

create table public.iguide_photo_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.iguide_photo_editors enable row level security;
revoke all on public.iguide_photo_editors from public, anon, authenticated;
grant select (user_id) on public.iguide_photo_editors to authenticated;
create policy "Editors can read their own authorization" on public.iguide_photo_editors
  for select to authenticated using (user_id = (select auth.uid()));

create schema iguide_private;
revoke all on schema iguide_private from public;
grant usage on schema iguide_private to anon, authenticated;

create function iguide_private.iguide_is_photo_editor() returns boolean
language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists (
  select 1 from public.iguide_photo_editors where user_id = (select auth.uid())
); $$;
revoke all on function iguide_private.iguide_is_photo_editor() from public;
grant execute on function iguide_private.iguide_is_photo_editor() to anon, authenticated;

create table public.iguide_place_covers (
  experience_id text primary key check (experience_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$'),
  object_path text not null unique,
  alt_text text not null check (length(btrim(alt_text)) between 1 and 160),
  rights_confirmed boolean not null check (rights_confirmed),
  published_by uuid not null default auth.uid(),
  updated_at timestamptz not null default now(),
  check (object_path ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,99}/[a-f0-9-]{36}\.jpg$'),
  check (split_part(object_path, '/', 1) = experience_id)
);
alter table public.iguide_place_covers enable row level security;
revoke all on public.iguide_place_covers from public, anon, authenticated;
grant select (experience_id, object_path, alt_text, updated_at) on public.iguide_place_covers to anon, authenticated;
-- ON CONFLICT reads the incoming rights flag; it remains hidden from anon.
grant select (rights_confirmed) on public.iguide_place_covers to authenticated;
grant insert (experience_id, object_path, alt_text, rights_confirmed),
  update (experience_id, object_path, alt_text, rights_confirmed), delete on public.iguide_place_covers to authenticated;

create function public.iguide_stamp_place_cover() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.published_by = auth.uid();
  return new;
end;
$$;
revoke all on function public.iguide_stamp_place_cover() from public;
create trigger iguide_place_cover_stamp before insert or update on public.iguide_place_covers
  for each row execute function public.iguide_stamp_place_cover();

create policy "Published covers are readable" on public.iguide_place_covers
  for select to anon, authenticated using (true);
create policy "Editors can publish existing uploads" on public.iguide_place_covers
  for insert to authenticated with check (iguide_private.iguide_is_photo_editor() and exists (
    select 1 from storage.objects o where o.bucket_id = 'iguide-place-covers' and o.name = object_path
  ));
create policy "Editors can replace existing uploads" on public.iguide_place_covers
  for update to authenticated using (iguide_private.iguide_is_photo_editor())
  with check (iguide_private.iguide_is_photo_editor() and exists (
    select 1 from storage.objects o where o.bucket_id = 'iguide-place-covers' and o.name = object_path
  ));
create policy "Editors can withdraw covers" on public.iguide_place_covers
  for delete to authenticated using (iguide_private.iguide_is_photo_editor());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('iguide-place-covers', 'iguide-place-covers', true, 2097152, array['image/jpeg']);

create policy "Editors can read cover objects" on storage.objects
  for select to authenticated using (bucket_id = 'iguide-place-covers' and iguide_private.iguide_is_photo_editor());
create policy "Editors can upload new covers" on storage.objects
  for insert to authenticated with check (bucket_id = 'iguide-place-covers' and iguide_private.iguide_is_photo_editor()
    and name ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,99}/[a-f0-9-]{36}\.jpg$');
create policy "Editors can delete retired cover objects" on storage.objects
  for delete to authenticated using (bucket_id = 'iguide-place-covers' and iguide_private.iguide_is_photo_editor()
    and not exists (select 1 from public.iguide_place_covers c where c.object_path = name));

-- Also restrict pre-existing broad policies for this bucket. Other buckets retain
-- their own policies. No direct UPDATE/overwrite is allowed for cover files.
create policy "Guard cover bucket" on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'iguide-place-covers' or iguide_private.iguide_is_photo_editor())
  with check (bucket_id <> 'iguide-place-covers' or (iguide_private.iguide_is_photo_editor()
    and name ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,99}/[a-f0-9-]{36}\.jpg$'));
create policy "Never overwrite cover objects" on storage.objects as restrictive
  for update to anon, authenticated using (bucket_id <> 'iguide-place-covers')
  with check (bucket_id <> 'iguide-place-covers');
create policy "Never delete an active cover object" on storage.objects as restrictive
  for delete to anon, authenticated using (bucket_id <> 'iguide-place-covers' or not exists (
    select 1 from public.iguide_place_covers c where c.object_path = name
  ));

commit;
