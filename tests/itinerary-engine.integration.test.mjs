import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createServer } from "vite";
import { FIXTURE_V1_X8B } from "./fixtures/itinerary-v1-x8b.mjs";

let server;
let buildItineraryPlan;
let catalog;
let isWetRisky;
let loadSavedItineraries;
let saveItineraryPlan;
let storage;

const STORAGE_KEY = "iguide.saved-itineraries.v1";

function useWorkingStorage() {
  storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) =>
      storage.set(key, String(value)),
  };
}

const profile = {
  name: "Fixture X8b",
  firstVisit: true,
  returnPointOnboardingComplete: true,
  travelMode: "solo",
  interests: [],
  level: 1,
  experience: 0,
  visitedExperiences: [],
  achievements: [],
  favorites: [],
};

const forecast = {
  date: "2026-08-31",
  city: "Huancayo",
  condition: "cloudy",
  temperatureMin: 6,
  temperatureMax: 24,
  precipitationProbability: 6,
  windSpeedKmh: 8,
  isHighMountainSafe: true,
  sunrise: "2026-08-31T06:02",
  sunset: "2026-08-31T17:52",
  periods: {
    morning: {
      hour: 9,
      temperature: 14,
      apparentTemperature: 13,
      condition: "cloudy",
      precipitationProbability: 3,
      windSpeedKmh: 5,
    },
    afternoon: {
      hour: 15,
      temperature: 24,
      apparentTemperature: 23,
      condition: "cloudy",
      precipitationProbability: 6,
      windSpeedKmh: 8,
    },
    night: {
      hour: 21,
      temperature: 12,
      apparentTemperature: 10,
      condition: "cloudy",
      precipitationProbability: 8,
      windSpeedKmh: 6,
    },
  },
};

before(async () => {
  useWorkingStorage();
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { language: "es-PE" },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      documentElement: { lang: "es" },
    },
  });
  server = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ buildItineraryPlan } =
    await server.ssrLoadModule(
      "/src/engine/itineraryEngine.ts"
    ));
  ({ catalog } = await server.ssrLoadModule(
    "/src/data/catalog/index.ts"
  ));
  ({ isWetRisky } = await server.ssrLoadModule(
    "/src/engine/experienceSafetyEngine.ts"
  ));
  ({
    loadSavedItineraries,
    saveItineraryPlan,
  } = await server.ssrLoadModule(
    "/src/engine/itineraryPersistenceEngine.ts"
  ));
});

after(async () => {
  await server?.close();
});

test("gastronomía usa franjas de comida y deja de encadenar seis restaurantes", () => {
  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-08-31",
        selectedHour: 9,
        endMinutes: 21 * 60,
        priorities: ["gastronomy"],
        transport: "taxi",
      },
    },
    { forecast, experiences: catalog }
  );

  assert.ok(plan);
  const restaurants = plan.stops.filter(
    (stop) => stop.experience.type === "restaurant"
  );
  assert.ok(
    restaurants.length <= 2,
    `${restaurants.length} restaurantes`
  );
  assert.ok(plan.stops.length <= 5);
  assert.equal(plan.endMinutes, 21 * 60);
  assert.equal(plan.availableMinutes, 12 * 60);
});

test("la hora de término es un límite duro y no una sugerencia", () => {
  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-08-31",
        selectedHour: 15,
        endMinutes: 18 * 60,
        priorities: ["surprise"],
        transport: "walking",
      },
    },
    { forecast, experiences: catalog }
  );

  assert.ok(plan);
  assert.ok(
    plan.stops.every(
      (stop) => stop.endMinutes <= 18 * 60
    )
  );
  assert.equal(plan.availableMinutes, 180);
  assert.ok(plan.stops.length <= 2);
  assert.equal(
    plan.selectedForecastPeriod?.hour,
    15
  );
});

test("las paradas urbanas consecutivas calculan traslados variables por coordenadas", () => {
  const urban = catalog.filter(
    (experience) =>
      !["expedition", "hotel"].includes(
        experience.type
      )
  );
  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-08-31",
        selectedHour: 9,
        endMinutes: 18 * 60,
        priorities: ["surprise"],
        transport: "walking",
      },
    },
    { forecast, experiences: urban }
  );

  assert.ok(plan);
  assert.ok(plan.stops.length >= 2);
  const afterFirst = plan.stops
    .slice(1)
    .map((stop) => stop.travelMinutes);
  assert.ok(
    afterFirst.some((minutes) => minutes !== 15),
    JSON.stringify(afterFirst)
  );
});

test("una mañana lluviosa reutiliza seguridad y excluye terrenos sensibles con razón", () => {
  const rainyMorning = {
    ...forecast,
    precipitationProbability: 85,
    periods: {
      ...forecast.periods,
      morning: {
        ...forecast.periods.morning,
        condition: "rain",
        precipitationProbability: 85,
      },
    },
  };
  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-08-31",
        selectedHour: 9,
        endMinutes: 12 * 60,
        priorities: ["surprise"],
        transport: "walking",
      },
    },
    {
      forecast: rainyMorning,
      experiences: catalog,
    }
  );

  assert.ok(plan);
  assert.ok(
    plan.exclusions.some(
      (item) =>
        item.explanation.reasonCode ===
        "weather-wet-risk"
    )
  );
  assert.ok(
    plan.stops.every(
      (stop) => !isWetRisky(stop.experience)
    )
  );
});

test("sin pronóstico el itinerario conserva la política prudente", () => {
  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-10-20",
        selectedHour: 15,
        endMinutes: 18 * 60,
        priorities: ["surprise"],
        transport: "walking",
      },
    },
    {
      forecast: null,
      experiences: catalog,
    }
  );

  assert.ok(plan);
  assert.ok(
    plan.exclusions.some(
      (item) =>
        item.explanation.reasonCode ===
        "weather-unknown-risk"
    )
  );
  assert.ok(
    plan.stops.every(
      (stop) => !isWetRisky(stop.experience)
    )
  );
});

test("guardar confirma por lectura posterior y conserva un plan V1 anterior", () => {
  useWorkingStorage();
  storage.set(
    STORAGE_KEY,
    JSON.stringify([
      {
        id: "fixture-v1-x8b",
        savedAt: 1,
        snapshot: FIXTURE_V1_X8B,
      },
    ])
  );

  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-08-31",
        selectedHour: 15,
        endMinutes: 19 * 60,
        priorities: ["photography", "culture"],
        transport: "walking",
      },
    },
    { forecast, experiences: catalog }
  );

  assert.ok(plan);
  const saved = saveItineraryPlan(plan, {
    priorities: ["photography", "culture"],
    transport: "walking",
  });
  const reloaded = loadSavedItineraries();

  assert.equal(reloaded[0].id, saved.id);
  assert.ok(
    reloaded.some(
      (item) => item.id === "fixture-v1-x8b"
    )
  );
  assert.equal(
    reloaded.find(
      (item) => item.id === "fixture-v1-x8b"
    )?.snapshot.schemaVersion,
    2
  );
});

test("guardar falla si el navegador ignora la escritura", () => {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => undefined,
  };

  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-08-31",
        selectedHour: 15,
        endMinutes: 19 * 60,
        priorities: ["surprise"],
        transport: "walking",
      },
    },
    { forecast, experiences: catalog }
  );

  assert.ok(plan);
  assert.throws(
    () =>
      saveItineraryPlan(plan, {
        priorities: ["surprise"],
        transport: "walking",
      }),
    /verify/i
  );

  useWorkingStorage();
});
