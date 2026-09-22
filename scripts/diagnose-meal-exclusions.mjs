// Characterization of P0-1 before correction; not acceptance of current labels.
import assert from "node:assert/strict";
import { createServer } from "vite";

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { language: "es-PE" } });
globalThis.document = { documentElement: { lang: "es" } };

const server = await createServer({
  appType: "custom", logLevel: "silent",
  server: { middlewareMode: true },
});
try {
  const { buildItineraryPlan } = await server.ssrLoadModule("/src/engine/itineraryEngine.ts");
  const { findNextMealWindow } = await server.ssrLoadModule("/src/engine/itineraryTimePolicyEngine.ts");
  const { catalog } = await server.ssrLoadModule("/src/data/catalog/index.ts");
  const profile = {
    name: "P0-1", firstVisit: true, returnPointOnboardingComplete: true,
    travelMode: "solo", interests: [], level: 1, experience: 0,
    visitedExperiences: [], achievements: [], favorites: [],
  };
  const paris = catalog.find((item) => item.slug === "paris");
  const bicho = catalog.find((item) => item.slug === "bicho");
  const bakery = catalog.find((item) => item.slug === "la-petite-bakery");
  assert.ok(paris && bicho && bakery);

  function run(name, experiences, start, end, location) {
    const plan = buildItineraryPlan({
      profile, location,
      answers: { selectedDate: "2026-09-19", selectedHour: start,
        endMinutes: end, priorities: ["gastronomy"], transport: "walking" },
    }, { experiences, forecast: null });
    assert.ok(plan);
    console.log(JSON.stringify({ name, window: [start * 60, end],
      stops: plan.stops.map((s) => ({ title: s.experience.title,
        start: s.startMinutes, end: s.endMinutes })),
      exclusions: plan.exclusions }, null, 2));
    return plan;
  }

  // Real catalog, fixed synthetic origin at Bicho, no live GPS/weather.
  const afternoon = run("Bicho + París + Bakery: 15–18", [bicho, paris, bakery], 15, 1080, bicho);
  assert.equal(afternoon.stops.length, 1);
  assert.equal(afternoon.stops[0].experience.experienceId, bicho.experienceId);
  assert.equal(afternoon.exclusions.find((e) => e.experienceId === paris.experienceId)?.explanation.reasonCode, "not-enough-time");
  assert.equal(afternoon.exclusions.find((e) => e.experienceId === bakery.experienceId)?.explanation.reasonCode, "meal-window-unavailable");

  const restaurantAlone = run("París solo: 15–18, sin ninguna franja ocupada", [paris], 15, 1080, paris);
  assert.equal(restaurantAlone.stops.length, 0);
  assert.equal(restaurantAlone.exclusions[0].explanation.reasonCode, "not-enough-time");

  const shortLunch = run("París solo: 12–12:30, tiempo realmente insuficiente", [paris], 12, 750, paris);
  assert.equal(shortLunch.exclusions[0].explanation.reasonCode, "not-enough-time");

  const secondRestaurant = { ...paris, experienceId: "DIAGNOSTIC-SECOND-RESTAURANT", title: "Segundo restaurante controlado" };
  const lunch = run("Dos restaurantes equivalentes: 12–15", [paris, secondRestaurant], 12, 900, paris);
  assert.equal(lunch.stops.length, 1);
  assert.equal(lunch.exclusions[0].explanation.reasonCode, "not-enough-time");

  const occupied = findNextMealWindow("cafe", 966, new Set(["snack"]));
  const free = findNextMealWindow("cafe", 966, new Set());
  const nextDinner = findNextMealWindow("restaurant", 966, new Set());
  assert.equal(occupied, null);
  assert.equal(free.slot, "snack");
  assert.equal(nextDinner.startMinutes, 1080);
  console.log(JSON.stringify({ policy: { occupied, free, nextDinner }, assertions: "PASS" }, null, 2));
} finally {
  await server.close();
}
