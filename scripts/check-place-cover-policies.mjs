// Run with IGUIDE_PGLITE_MODULE pointing to an installed @electric-sql/pglite
// module. Exercises the actual migration on PostgreSQL/WASM with local fixtures;
// it does not replace an integration check against Supabase Auth and Storage.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const modulePath = process.env.IGUIDE_PGLITE_MODULE || '@electric-sql/pglite';
const { PGlite } = await import(modulePath);
const db = new PGlite();
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const first = 'CAF-0001/11111111-1111-4111-8111-111111111111.jpg';
const second = 'CAF-0001/22222222-2222-4222-8222-222222222222.jpg';
let checks = 0;
async function as(role, user, statement, parameters = []) {
  await db.exec(`begin; set local role ${role};`);
  try {
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    const result = await db.query(statement, parameters);
    await db.exec('commit');
    return result;
  } catch (error) { await db.exec('rollback'); throw error; }
}
async function check(name, fn) { await fn(); checks++; console.log(`PASS ${name}`); }
try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create schema storage;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets (id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id), name text not null, metadata jsonb,
      unique(bucket_id, name));
    alter table storage.objects enable row level security;
    grant usage on schema public, auth, storage to anon, authenticated;
    grant select, insert, update, delete on storage.objects to anon, authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    -- Deliberately broad legacy policy: the new bucket must remain protected.
    create policy legacy_open_storage on storage.objects for all to anon, authenticated
      using (true) with check (true);
    insert into auth.users values ('${alice}'), ('${bob}');
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/202611020001_place_covers.sql', import.meta.url), 'utf8'));
  await db.query('insert into public.iguide_photo_editors values ($1)', [alice]);
  await check('authorization stays outside public RPC and follows the signed-in user', async () => {
    assert.equal((await db.query("select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='iguide_is_photo_editor'")).rows[0].n, 0);
    for (const role of ['anon', 'authenticated']) {
      assert.equal((await db.query("select has_function_privilege($1, 'public.iguide_stamp_place_cover()', 'execute') as allowed", [role])).rows[0].allowed, false);
    }
    assert.equal((await as('anon', '', 'select iguide_private.iguide_is_photo_editor() as allowed')).rows[0].allowed, false);
    assert.equal((await as('authenticated', bob, 'select iguide_private.iguide_is_photo_editor() as allowed')).rows[0].allowed, false);
    assert.equal((await as('authenticated', alice, 'select iguide_private.iguide_is_photo_editor() as allowed')).rows[0].allowed, true);
  });
  await check('anonymous users cannot upload despite a broad legacy policy', async () => {
    await assert.rejects(as('anon', '', "insert into storage.objects(bucket_id,name) values ('iguide-place-covers',$1)", [first]), /row-level security/);
  });
  await check('a non-editor cannot upload or grant themselves editor access', async () => {
    await assert.rejects(as('authenticated', bob, "insert into storage.objects(bucket_id,name) values ('iguide-place-covers',$1)", [first]), /row-level security/);
    await assert.rejects(as('authenticated', bob, 'insert into public.iguide_photo_editors values ($1)', [bob]), /permission denied/);
    assert.equal((await as('authenticated', bob, 'select user_id from public.iguide_photo_editors')).rows.length, 0);
  });
  await check('an editor can upload and publish while the server stamps authorship', async () => {
    await as('authenticated', alice, "insert into storage.objects(bucket_id,name) values ('iguide-place-covers',$1)", [first]);
    const result = await as('authenticated', alice, `insert into public.iguide_place_covers
      (experience_id,object_path,alt_text,rights_confirmed) values ('CAF-0001',$1,'Bicho',true)
      returning experience_id,object_path,alt_text,updated_at`, [first]);
    assert.equal(result.rows[0].object_path, first);
    assert.equal((await db.query('select published_by from public.iguide_place_covers')).rows[0].published_by, alice);
  });
  await check('public readers see only the publication fields', async () => {
    assert.equal((await as('anon', '', 'select experience_id,object_path,alt_text,updated_at from public.iguide_place_covers')).rows.length, 1);
    await assert.rejects(as('anon', '', 'select published_by from public.iguide_place_covers'), /permission denied/);
    await assert.rejects(as('anon', '', 'select rights_confirmed from public.iguide_place_covers'), /permission denied/);
    assert.equal((await as('anon', '', "select name from storage.objects where bucket_id='iguide-place-covers'")).rows.length, 0);
  });
  await check('anonymous and non-editor writes are blocked at the database', async () => {
    await assert.rejects(as('anon', '', "delete from public.iguide_place_covers where experience_id='CAF-0001'"), /permission denied/);
    assert.equal((await as('authenticated', bob, "update public.iguide_place_covers set alt_text='forged' returning experience_id")).rows.length, 0);
    assert.equal((await as('authenticated', bob, 'delete from public.iguide_place_covers returning experience_id')).rows.length, 0);
  });
  await check('the active storage object cannot be deleted or overwritten by any client editor', async () => {
    assert.equal((await as('authenticated', alice, 'delete from storage.objects where name=$1 returning name', [first])).rows.length, 0);
    assert.equal((await as('authenticated', alice, "update storage.objects set metadata='{}' where name=$1 returning name", [first])).rows.length, 0);
  });
  await check('nonexistent files, forged authorship and missing rights are rejected', async () => {
    await assert.rejects(as('authenticated', alice, 'update public.iguide_place_covers set object_path=$1', [second]), /row-level security/);
    await assert.rejects(as('authenticated', alice, 'update public.iguide_place_covers set rights_confirmed=false'), /check constraint/);
    await assert.rejects(as('authenticated', alice, 'update public.iguide_place_covers set published_by=$1', [bob]), /permission denied/);
    await assert.rejects(as('authenticated', alice, "update public.iguide_place_covers set experience_id='CAF-0002'"), /permission denied/);
    await assert.rejects(as('authenticated', alice, "insert into storage.objects(bucket_id,name) values ('iguide-place-covers','unsafe.svg')"), /row-level security/);
  });
  await check('a stale replacement cannot overwrite a newer publication', async () => {
    await as('authenticated', alice, "insert into storage.objects(bucket_id,name) values ('iguide-place-covers',$1)", [second]);
    const replace = `update public.iguide_place_covers
      set object_path=$1, alt_text='Bicho actualizado', rights_confirmed=true
      where experience_id='CAF-0001' and object_path=$2
      returning experience_id,object_path,alt_text,updated_at`;
    assert.equal((await as('authenticated', alice, replace, [second, first])).rows[0].object_path, second);
    assert.equal((await as('authenticated', alice, replace, [first, first])).rows.length, 0);
    assert.equal((await as('anon', '', 'select object_path from public.iguide_place_covers')).rows[0].object_path, second);
  });
  await check('a stale withdrawal cannot remove a newer publication', async () => {
    assert.equal((await as('authenticated', alice, 'delete from public.iguide_place_covers where experience_id=$1 and object_path=$2 returning experience_id', ['CAF-0001', first])).rows.length, 0);
    assert.equal((await as('authenticated', alice, 'delete from storage.objects where name=$1 returning name', [first])).rows.length, 1);
  });
  await check('confirmed withdrawal allows deletion of its retired file', async () => {
    assert.equal((await as('authenticated', alice, 'delete from public.iguide_place_covers where object_path=$1 returning experience_id', [second])).rows.length, 1);
    assert.equal((await as('authenticated', alice, 'delete from storage.objects where name=$1 returning name', [second])).rows.length, 1);
    assert.equal((await as('anon', '', 'select experience_id from public.iguide_place_covers')).rows.length, 0);
  });
  await check('policies do not change the access rules of another bucket', async () => {
    await db.exec("insert into storage.buckets(id,name,public) values ('unrelated','unrelated',false)");
    await as('anon', '', "insert into storage.objects(bucket_id,name) values ('unrelated','old-policy.txt')");
    assert.equal((await as('anon', '', "select name from storage.objects where bucket_id='unrelated'")).rows.length, 1);
  });
  console.log(`${checks}/${checks} PostgreSQL policy checks passed (local fixtures).`);
} catch (error) {
  console.error('Policy check failed:', error.message, error.code ?? '');
  process.exitCode = 1;
} finally { await db.close(); }
