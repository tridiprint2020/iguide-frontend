import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';

let server, Service, contract, store;
const config = { url: 'https://test-project.supabase.co', publishableKey: 'sb_publishable_test' };
const uid = '11111111-1111-4111-8111-111111111111';
const uuid = '22222222-2222-4222-8222-222222222222';
const row = (path = `CAF-0001/${uuid}.jpg`) => ({ experience_id: 'CAF-0001', object_path: path, alt_text: 'Fachada de Bicho', updated_at: '2026-11-02T20:00:00Z' });
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const login = () => json({ access_token: 'editor-token', refresh_token: 'never-persist-this', expires_in: 3600, user: { id: uid, email: 'editor@example.test' } });
const photo = () => new Blob(['jpeg-test-content'], { type: 'image/jpeg' });
function makeService(route = () => json([])) {
  const calls = [];
  const client = new Service(config, async (url, init) => {
    const request = { url, ...init }; calls.push(request);
    if (url.includes('/auth/v1/token')) return login();
    if (url.includes('/iguide_photo_editors')) return json([{ user_id: uid }]);
    if (url.includes('/auth/v1/logout')) return new Response(null, { status: 204 });
    return route(request);
  });
  return { client, calls };
}
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  Service = (await server.ssrLoadModule('/src/services/placePhotoService.ts')).PlacePhotoService;
  contract = await server.ssrLoadModule('/src/engine/placeCoverContract.ts');
  store = await server.ssrLoadModule('/src/engine/placeCoverStore.ts');
});
after(async () => { await server?.close(); });

test('rejects secret keys, service_role JWTs and non-HTTPS configuration before requests', () => {
  const jwt = `x.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.y`;
  for (const publishableKey of ['sb_secret_never', jwt, 'invalid']) assert.throws(() => new Service({ ...config, publishableKey }));
  for (const url of ['http://project.supabase.co', 'https://user:pass@test.supabase.co', 'https://test.supabase.co/?key=unsafe']) {
    assert.throws(() => new Service({ ...config, url }));
  }
});
test('public photo reads send no editor token, cookie or personal session', async () => {
  const { client, calls } = makeService(() => json([row()]));
  await client.signIn('editor@example.test', 'password');
  assert.equal((await client.listCovers()).length, 1);
  const request = calls.at(-1);
  assert.equal(request.headers.get('Authorization'), null);
  assert.equal(request.headers.get('apikey'), config.publishableKey);
  assert.equal(request.credentials, 'omit');
  assert.equal(request.referrerPolicy, 'no-referrer');
});
test('a signed-in user not on the editor list is refused and cannot upload', async () => {
  const calls = [];
  const client = new Service(config, async (url, init) => {
    calls.push({ url, init });
    if (url.includes('/auth/v1/token')) return login();
    if (url.includes('/iguide_photo_editors')) return json([]);
    return new Response(null, { status: 204 });
  });
  await assert.rejects(client.signIn('editor@example.test', 'password'), /no está habilitada/);
  await assert.rejects(client.publishCover('CAF-0001', photo(), 'Bicho', true), /sesión terminó/);
  assert.equal(calls.some(call => call.url.includes('/storage/')), false);
});
test('requires a live session, photo rights and validated JPEG before upload', async () => {
  const { client, calls } = makeService();
  await assert.rejects(client.publishCover('CAF-0001', photo(), 'Bicho', true), /sesión terminó/);
  await client.signIn('editor@example.test', 'password');
  const count = calls.length;
  await assert.rejects(client.publishCover('CAF-0001', photo(), 'Bicho', false), /autorización/);
  await assert.rejects(client.publishCover('../other', photo(), 'Bicho', true), /local válido/);
  await assert.rejects(client.publishCover('CAF-0001', new Blob(['svg'], { type: 'image/svg+xml' }), 'Bicho', true), /JPG/);
  await assert.rejects(client.publishCover('CAF-0001', photo(), ' ', true), /descripción/);
  assert.equal(calls.length, count);
});
test('server confirmation publishes the new file and never overwrites an existing object', async () => {
  const { client, calls } = makeService(request => {
    if (request.url.includes('/storage/')) return json({ Key: 'ok' });
    const data = JSON.parse(request.body);
    return json([{ ...row(data.object_path), alt_text: data.alt_text }]);
  });
  await client.signIn('editor@example.test', 'password');
  const confirmed = await client.publishCover('CAF-0001', photo(), ' Bicho ', true);
  assert.match(confirmed.object_path, /^CAF-0001\/[a-f0-9-]{36}\.jpg$/);
  assert.equal(confirmed.alt_text, 'Bicho');
  const upload = calls.find(call => call.url.includes('/storage/'));
  assert.equal(upload.headers.get('x-upsert'), 'false');
  assert.equal(upload.headers.get('Authorization'), 'Bearer editor-token');
  const publication = calls.at(-1);
  assert.equal(JSON.parse(publication.body).rights_confirmed, true);
  assert.match(publication.headers.get('Prefer'), /return=representation/);
});
test('failed upload never attempts a metadata publication', async () => {
  const { client, calls } = makeService(() => json({ error: 'storage unavailable' }, 500));
  await client.signIn('editor@example.test', 'password');
  await assert.rejects(client.publishCover('CAF-0001', photo(), 'Bicho', true));
  assert.equal(calls.some(call => call.url.includes('on_conflict')), false);
});
test('an unconfirmed metadata write reports failure and does not delete a potentially committed image', async () => {
  const { client, calls } = makeService(request => {
    if (request.url.includes('/storage/')) return json({ Key: 'ok' });
    if (request.method === 'POST') return json({ error: 'failed' }, 500);
    return json([row()]);
  });
  await client.signIn('editor@example.test', 'password');
  await assert.rejects(client.publishCover('CAF-0001', photo(), 'Bicho', true), /no pudimos confirmar/);
  assert.equal(calls.some(call => call.method === 'DELETE'), false);
});
test('a lost response reconciles a committed publication instead of claiming failure or deleting it', async () => {
  let saved;
  const { client, calls } = makeService(request => {
    if (request.url.includes('/storage/')) return json({ Key: 'ok' });
    if (request.method === 'POST') { saved = row(JSON.parse(request.body).object_path); throw new TypeError('connection lost'); }
    return json([saved]);
  });
  await client.signIn('editor@example.test', 'password');
  assert.deepEqual(await client.publishCover('CAF-0001', photo(), 'Bicho', true), saved);
  assert.equal(calls.some(call => call.method === 'DELETE'), false);
});
test('expiry blocks a write before any HTTP upload', async () => {
  const { client, calls } = makeService();
  await client.signIn('editor@example.test', 'password');
  const now = Date.now;
  Date.now = () => now() + 86400001;
  try {
    const count = calls.length;
    await assert.rejects(client.publishCover('CAF-0001', photo(), 'Bicho', true), /sesión terminó/);
    assert.equal(calls.length, count);
  } finally { Date.now = now; }
});
test('withdrawal compares the read path and never deletes a newer cover', async () => {
  const { client, calls } = makeService(() => json([]));
  await client.signIn('editor@example.test', 'password');
  await assert.rejects(client.removeCover(row()), /portada cambió/);
  assert.match(calls.at(-1).url, /object_path=eq.CAF-0001/);
  assert.equal(calls.some(call => call.url.includes('/storage/')), false);
});
test('withdrawal distinguishes removal from the guide from an unconfirmed file deletion', async () => {
  const { client } = makeService(request => request.url.includes('/storage/') ? json({}, 500) : json([row()]));
  await client.signIn('editor@example.test', 'password');
  assert.deepEqual(await client.removeCover(row()), { fileDeleted: false });
});
test('input and remote metadata reject SVG, oversize files and paths for a different place', () => {
  assert.throws(() => contract.assertPhotoInput({ type: 'image/svg+xml', size: 100 }));
  assert.throws(() => contract.assertPhotoInput({ type: 'image/jpeg', size: 13 * 1024 * 1024 }));
  contract.assertPhotoInput({ type: 'image/jpeg', size: 100 });
  assert.throws(() => contract.parsePublishedCovers([row(`OTHER/${uuid}.jpg`)]));
  assert.throws(() => contract.parsePublishedCovers([row('https://other.test/tracking.jpg')]));
});
test('presentation updates subscribers without modifying the catalogue or recommendation fields', () => {
  let updates = 0;
  const unsubscribe = store.subscribeToPlaceCovers(() => updates++);
  const place = { experienceId: 'CAF-0001', slug: 'bicho', image: '', coverImage: 'logo-iguide.png', rating: 3.5 };
  store.replacePlaceCovers(config.url, []);
  store.setPlaceCover(config.url, row());
  assert.match(store.getPlaceCoverSnapshot().get('CAF-0001').url, /storage\/v1\/object\/public\/iguide-place-covers/);
  store.forgetPlaceCover('CAF-0001');
  assert.equal(store.getPlaceCoverSnapshot().has('CAF-0001'), false);
  assert.equal(contract.incorporatedPlaceCover(place), '/images/cafes/bicho.jpg');
  assert.equal(place.image, '');
  assert.equal(place.rating, 3.5);
  assert.equal(updates, 3);
  unsubscribe();
});
