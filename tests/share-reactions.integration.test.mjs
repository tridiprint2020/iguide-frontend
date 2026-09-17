import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import { FIXTURE_V1_X8B } from "./fixtures/itinerary-v1-x8b.mjs";

let server;
let sharing;
let user;
let migrate;
const storage = new Map();
let events = 0;

before(async () => {
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };
  globalThis.window = { dispatchEvent: () => { events++; } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { language: "es-PE" } });
  globalThis.document = { documentElement: { lang: "es" } };
  server = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  sharing = await server.ssrLoadModule("/src/engine/itineraryShareEngine.ts");
  user = await server.ssrLoadModule("/src/data/user.ts");
  ({ migrateItinerarySnapshot: migrate } = await server.ssrLoadModule("/src/engine/itinerarySnapshotMigrationEngine.ts"));
});
after(async () => { await server?.close(); });

test("el lector real abre un enlace V1 antiguo y conserva sus ocho paradas", () => {
  const payload = Buffer.from(JSON.stringify(FIXTURE_V1_X8B)).toString("base64url");
  const result = sharing.readSharedItinerary(`https://example.test/itinerario?plan=${payload}`);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.snapshot, migrate(FIXTURE_V1_X8B));
  assert.equal(result.snapshot.stops.length, 8);
});

test("el enlace nuevo conserva fecha, horarios, preferencias y paradas sin depender del almacenamiento", () => {
  const snapshot = migrate(FIXTURE_V1_X8B);
  const url = sharing.buildItineraryShareUrl(snapshot, "https://example.test");
  storage.clear();
  const result = sharing.readSharedItinerary(url);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.snapshot, { ...snapshot, exclusions: [] });
  assert.equal(new URL(url).pathname, "/itinerario");
});

test("enlaces corruptos y demasiado largos se rechazan sin lanzar excepciones", () => {
  for (const payload of ["%%%", "abc", "a".repeat(12001), Buffer.from("{}").toString("base64url")]) {
    assert.equal(sharing.readSharedItinerary(`https://example.test/itinerario?plan=${encodeURIComponent(payload)}`).status, "invalid");
  }
  assert.equal(sharing.readSharedItinerary("https://example.test/itinerario").status, "absent");
});

test("formato compacto reduce el enlace al menos 50% conservando el pronóstico completo", () => {
  const snapshot = migrate(FIXTURE_V1_X8B);
  for (const count of [1, 8]) {
    const plan = { ...snapshot, stops: snapshot.stops.slice(0, count), exclusions: [] };
    const oldPayload = Buffer.from(JSON.stringify(plan)).toString("base64url");
    const encoded = sharing.encodeItinerarySnapshot(plan);
    assert.ok(encoded.startsWith("c1."));
    assert.ok(encoded.length < oldPayload.length * 0.5, `${count} paradas: ${oldPayload.length} → ${encoded.length}`);
    assert.deepEqual(sharing.decodeItinerarySnapshot(encoded), plan);
    console.log(`Enlace ${count} paradas, caracteres de payload: ${oldPayload.length} → ${encoded.length}`);
  }
});

test("compacto conserva campos opcionales, acentos y planes sin pronóstico", () => {
  const snapshot = migrate(FIXTURE_V1_X8B);
  snapshot.forecast.city = "Huancayo – Perú 🦊";
  Object.assign(snapshot.forecast, { apparentTemperature: 0, uvIndexMax: 0,
    sunrise: "2026-08-31T06:02", sunset: "2026-08-31T17:52",
    daylightDurationSeconds: 42600, precipitationHours: 0 });
  snapshot.stops[0].explanation.params = { text: "Menú: ají y café", enabled: false, zero: 0 };
  for (const plan of [snapshot, { ...snapshot, forecast: null, selectedForecastPeriod: null }]) {
    assert.deepEqual(sharing.decodeItinerarySnapshot(sharing.encodeItinerarySnapshot(plan)), { ...plan, exclusions: [] });
  }
});

test("formato compacto incompleto o desconocido no produce un itinerario", () => {
  for (const value of [[], {}, ["2026-09-17"], ["2026-09-17",12,900,60,[],null,null,[]]]) {
    const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
    assert.equal(sharing.decodeItinerarySnapshot(`c1.${payload}`), null);
  }
  assert.equal(sharing.decodeItinerarySnapshot("c2.W10"), null);
});

test("compartir y copiar entregan una sola URL compacta y cancelación no copia", async () => {
  const snapshot = migrate(FIXTURE_V1_X8B);
  let sent;
  let copied;
  navigator.share = async (data) => { sent = data; };
  navigator.clipboard = { writeText: async (value) => { copied = value; } };
  assert.equal(await sharing.shareItinerary(snapshot, "https://example.test"), "shared");
  assert.ok(new URL(sent.url).searchParams.get("plan").startsWith("c1."));
  assert.equal(sharing.readSharedItinerary(sent.url).status, "ready");
  assert.equal(copied, undefined);
  navigator.share = async () => { throw new DOMException("Cancelado", "AbortError"); };
  assert.equal(await sharing.shareItinerary(snapshot, "https://example.test"), "cancelled");
  assert.equal(copied, undefined);
  delete navigator.share;
  assert.equal(await sharing.shareItinerary(snapshot, "https://example.test"), "copied");
  assert.equal(copied.split(sent.url).length - 1, 1);
});

test("Me gusta y Recomendar persisten juntos sin duplicarse ni emitir eventos al releer", () => {
  storage.clear();
  user.setFavoriteReaction("fixture-local", "loved");
  user.setFavoriteReaction("fixture-local", "recommended");
  user.setFavoriteReaction("fixture-local", "loved");
  const beforeRead = events;
  const reloaded = user.loadUserProfile();
  assert.equal(events, beforeRead);
  assert.equal(reloaded.favorites.length, 1);
  assert.deepEqual(new Set(user.getFavoriteReactions(reloaded.favorites[0])), new Set(["loved", "recommended"]));
  assert.deepEqual(user.loadUserProfile(), reloaded);
});

test("un favorito legacy conserva su reacción al agregar la segunda", () => {
  storage.clear();
  storage.set("iguide_user_profile", JSON.stringify({ firstVisit: false, favorites: [{ experienceId: "legacy", reaction: "loved", createdAt: 1, updatedAt: 1 }] }));
  user.setFavoriteReaction("legacy", "recommended");
  const favorite = user.loadUserProfile().favorites[0];
  assert.deepEqual(user.getFavoriteReactions(favorite), ["loved", "recommended"]);
  assert.equal(favorite.createdAt, 1);
});
