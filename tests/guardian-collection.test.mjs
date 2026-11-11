import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { getGuardianCollection, guardians } from "../src/data/guardians.ts";
import { collectibleCollections, collectibleStickers, getStickerCollection } from "../src/data/collectibles.ts";
import { statSync } from "node:fs";

test("los cuatro guardianes corresponden a las misiones acordadas", () => {
  assert.deepEqual(guardians.map(({ name, experienceId }) => [name, experienceId]), [
    ["Atoq", "EXP-0001"],
    ["Picaflor", "EXP-0004"],
    ["Cóndor", "EXP-0002"],
    ["Taruka", "EXP-0003"],
  ]);
});

test("un perfil nuevo y las visitas a otros locales no desbloquean guardianes", () => {
  assert.equal(getGuardianCollection([]).filter((item) => item.collected).length, 0);
  assert.equal(getGuardianCollection(["HOT-0107", "CRA-0001"]).filter((item) => item.collected).length, 0);
});

test("las misiones históricas se reconocen y las repetidas dan un solo guardián", () => {
  const result = getGuardianCollection(["EXP-0003", "EXP-0001", "EXP-0001"]);
  assert.deepEqual(result.filter((item) => item.collected).map((item) => item.id), ["atoq", "taruka"]);
  assert.equal(result.length, 4);
});

test("cada colección muestra únicamente los guardianes y stickers de su lugar", () => {
  assert.equal(getGuardianCollection(["EXP-0001"], "mantaro").length, 4);
  assert.equal(getGuardianCollection(["EXP-0001"], "lima").length, 0);
  assert.equal(getStickerCollection([], "mantaro").length, 2);
  assert.equal(getStickerCollection([], "lima").length, 0);
  for (const item of [...guardians, ...collectibleStickers]) {
    assert.ok(collectibleCollections.some((collection) => collection.id === item.collectionId));
  }
});

test("los stickers en preparación no se otorgan por completar una misión ajena", () => {
  const stickers = getStickerCollection(["EXP-0001", "EXP-0002", "CRA-0001", "CRA-0002"]);
  assert.equal(stickers.length, 2);
  assert.ok(stickers.every((sticker) => !sticker.collected && !sticker.experienceId));
  for (const sticker of stickers) {
    assert.ok(statSync(new URL(`../public${sticker.image}`, import.meta.url)).size < 150_000);
  }
});

let server;
let user;
let i18n;
let Guardians;
let GuardianCollectionLink;
let JourneyProvider;
let WeatherProvider;
let storage;

before(async () => {
  storage = new Map([["iguide.lang", "es"]]);
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = { dispatchEvent() {} };
  globalThis.document = { documentElement: { lang: "es" } };
  server = await createServer({ appType: "custom", server: { middlewareMode: true, hmr: false } });
  user = await server.ssrLoadModule("/src/data/user.ts");
  ({ default: i18n } = await server.ssrLoadModule("/src/i18n/index.ts"));
  ({ default: Guardians } = await server.ssrLoadModule("/src/pages/Guardians.tsx"));
  ({ default: GuardianCollectionLink } = await server.ssrLoadModule("/src/components/guardians/GuardianCollectionLink.tsx"));
  ({ JourneyProvider } = await server.ssrLoadModule("/src/context/JourneyContext.tsx"));
  ({ WeatherProvider } = await server.ssrLoadModule("/src/context/WeatherContext.tsx"));
});

after(async () => { await server?.close(); });

function render(component, props, path = "/guardianes") {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] },
    createElement(WeatherProvider, null,
      createElement(JourneyProvider, null, createElement(component, props)))));
}

test("los cuatro enlaces llevan a fichas publicadas del catálogo actual", async () => {
  storage.delete("iguide_user_profile");
  const { getExperienceById } = await server.ssrLoadModule("/src/repository/catalogRepository.ts");
  const markup = render(Guardians);
  for (const guardian of guardians) {
    const experience = getExperienceById(guardian.experienceId);
    assert.equal(experience.type, "expedition");
    assert.equal(experience.isActive, true);
    assert.ok(markup.includes(`href="/expedition/${experience.slug}"`));
  }
  assert.equal((markup.match(/Conocer su misión/g) ?? []).length, 4);
});

test("completar la misión actualiza la colección y un reintento conserva los XP", () => {
  storage.delete("iguide_user_profile");
  const result = user.completeExpedition("EXP-0001", 150);
  const repeated = user.completeExpedition("EXP-0001", 150);
  assert.equal(result.experience, 150);
  assert.equal(repeated.experience, 150);
  assert.deepEqual(repeated.visitedExperiences, ["EXP-0001"]);
  const restored = user.loadUserProfile();
  assert.equal(getGuardianCollection(restored.visitedExperiences).filter((item) => item.collected).length, 1);
  const markup = render(Guardians);
  assert.equal((markup.match(/guardian-card--collected/g) ?? []).length, 1);
  assert.ok(markup.includes("1 de 4 guardianes coleccionados"));
  assert.ok(render(GuardianCollectionLink, { experienceId: "EXP-0001" }).includes("Atoq en tu colección"));
  assert.equal(render(GuardianCollectionLink, { experienceId: "EXP-0002" }), "");
  assert.equal(render(GuardianCollectionLink, { experienceId: "HOT-0107" }), "");
});

test("el progreso y las instrucciones se traducen en ES y EN", async () => {
  for (const [language, title, progress, action] of [
    ["es", "Coleccionables del Valle", "1 de 4 guardianes coleccionados", "Conocer su misión"],
    ["en", "Valley collectibles", "1 of 4 guardians collected", "Explore this mission"],
  ]) {
    await i18n.changeLanguage(language);
    const markup = render(Guardians);
    assert.ok(markup.includes(title));
    assert.ok(markup.includes(progress));
    assert.ok(markup.includes(action));
    assert.ok(markup.includes(language === "es" ? "este navegador y dispositivo" : "this browser and on this device"));
    assert.ok(render(GuardianCollectionLink).includes('href="/guardianes"'));
    assert.ok(markup.includes(language === "es" ? "Ampliar sticker Mate burilado" : "Enlarge Carved gourd sticker"));
  }
});

test("Lima tiene su espacio propio y conserva el progreso guardado del Valle", async () => {
  await i18n.changeLanguage("es");
  const before = storage.get("iguide_user_profile");
  const lima = render(Guardians, undefined, "/guardianes?coleccion=lima");
  assert.ok(lima.includes("Coleccionables de Lima"));
  assert.ok(lima.includes("Una nueva colección está por llegar"));
  assert.ok(!lima.includes('class="guardian-card '));
  assert.ok(!lima.includes('class="sticker-card"'));
  assert.equal(storage.get("iguide_user_profile"), before);
  const mantaro = render(Guardians, undefined, "/guardianes?coleccion=mantaro");
  assert.ok(mantaro.includes("1 de 4 guardianes coleccionados"));
  assert.ok(mantaro.includes("Mate burilado"));
  assert.ok(mantaro.includes("Telar wanka"));
});
