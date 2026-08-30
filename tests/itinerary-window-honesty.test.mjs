import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  FALLBACK_TRAVEL_MINUTES,
  estimateTravelMinutes,
} from "../src/engine/itineraryTravelEngine.ts";
import {
  getMealSlot,
  isOutdoorVisitAfterSunset,
} from "../src/engine/itineraryTimePolicyEngine.ts";
import {
  migrateItinerarySnapshot,
} from "../src/engine/itinerarySnapshotMigrationEngine.ts";
import { FIXTURE_V1_X8B } from "./fixtures/itinerary-v1-x8b.mjs";
import en from "../src/i18n/en.ts";

test("FIXTURE-V1-X8B migra a v2 sin perder sus ocho paradas", () => {
  const migrated = migrateItinerarySnapshot(FIXTURE_V1_X8B);

  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, 2);
  assert.deepEqual(migrated.preferences.priorities, ["gastronomy"]);
  assert.equal(migrated.endMinutes, 21 * 60);
  assert.equal(migrated.stops.length, 8);
  assert.deepEqual(
    migrated.stops.map((stop) => stop.experienceId),
    FIXTURE_V1_X8B.stops.map((stop) => stop.experienceId)
  );
  assert.deepEqual(
    migrated.forecast?.periods,
    FIXTURE_V1_X8B.forecast.periods
  );
});

test("el payload base64url de un enlace v1 continúa siendo legible", () => {
  const encoded = Buffer.from(
    JSON.stringify(FIXTURE_V1_X8B),
    "utf8"
  ).toString("base64url");
  const decoded = JSON.parse(
    Buffer.from(encoded, "base64url").toString(
      "utf8"
    )
  );
  const migrated = migrateItinerarySnapshot(decoded);

  assert.equal(migrated?.schemaVersion, 2);
  assert.equal(migrated?.stops.length, 8);
});

test("un snapshot v2 vuelve a validarse sin alterar sus decisiones", () => {
  const migrated = migrateItinerarySnapshot(FIXTURE_V1_X8B);
  const reparsed = migrateItinerarySnapshot(migrated);

  assert.deepEqual(reparsed, migrated);
});

test("un kilómetro caminando estima aproximadamente 17 minutos", () => {
  const minutes = estimateTravelMinutes(
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0.008993 },
    "walking"
  );

  assert.ok(minutes >= 15 && minutes <= 19, `${minutes} min`);
});

test("sin coordenadas se conserva el fallback por transporte", () => {
  assert.equal(
    estimateTravelMinutes(null, null, "taxi"),
    FALLBACK_TRAVEL_MINUTES.taxi
  );
});

test("una visita exterior que termina después del atardecer se excluye", () => {
  assert.equal(
    isOutdoorVisitAfterSunset({
      visitEndMinutes: 18 * 60 + 20,
      sunset: "2026-08-31T18:05",
      isOutdoorSensitive: true,
    }),
    true
  );
  assert.equal(
    isOutdoorVisitAfterSunset({
      visitEndMinutes: 18 * 60 + 20,
      sunset: "2026-08-31T18:05",
      isOutdoorSensitive: false,
    }),
    false
  );
});

test("sin dato de atardecer se aplica el límite conservador de las 18:00", () => {
  assert.equal(
    isOutdoorVisitAfterSunset({
      visitEndMinutes: 18 * 60 + 1,
      sunset: null,
      isOutdoorSensitive: true,
    }),
    true
  );
});

test("las comidas se asignan a franjas humanas y no a una cadena continua", () => {
  assert.equal(getMealSlot("restaurant", 13 * 60), "lunch");
  assert.equal(getMealSlot("restaurant", 16 * 60), null);
  assert.equal(getMealSlot("restaurant", 19 * 60), "dinner");
  assert.equal(getMealSlot("cafe", 9 * 60), "breakfast");
  assert.equal(getMealSlot("cafe", 16 * 60), "snack");
});

test("las etiquetas nuevas del itinerario tienen traducción inglesa", () => {
  const requiredKeys = [
    "Historia y cultura",
    "Artesanía",
    "Fiestas locales",
    "Ver todo el mes",
    "Ocultar calendario mensual",
    "¿Hasta qué hora tienes tiempo?",
    "Ventana elegida",
    "sensación",
    "UV máximo",
    "Atardecer",
    "Excluido porque terminaría después del atardecer",
    "No corresponde a una franja de comida disponible",
  ];

  for (const key of requiredKeys) {
    assert.equal(
      typeof en[key],
      "string",
      `Falta traducción inglesa: ${key}`
    );
    assert.ok(en[key].length > 0);
  }
});

test("ningún texto literal del itinerario queda sin traducción inglesa", () => {
  const files = [
    "../src/pages/ItineraryPage.tsx",
    "../src/components/itinerary/ItineraryPlanResult.tsx",
    "../src/components/itinerary/WeeklyForecast.tsx",
    "../src/components/itinerary/SavedItineraryPlans.tsx",
    "../src/components/itinerary/ItineraryPlanActions.tsx",
  ];

  for (const relativePath of files) {
    const source = readFileSync(
      new URL(relativePath, import.meta.url),
      "utf8"
    );

    for (const match of source.matchAll(
      /tx\(\s*"((?:\\.|[^"\\])*)"/gs
    )) {
      const key = JSON.parse(`"${match[1]}"`);
      assert.equal(
        typeof en[key],
        "string",
        `Falta traducción inglesa en ${relativePath}: ${key}`
      );
    }
  }
});

test("el clima ampliado reutiliza la llamada semanal existente", () => {
  const source = readFileSync(
    new URL(
      "../src/engine/weatherService.ts",
      import.meta.url
    ),
    "utf8"
  );

  for (const field of [
    "apparent_temperature",
    "uv_index_max",
    "sunrise",
    "sunset",
    "daylight_duration",
    "precipitation_hours",
  ]) {
    assert.ok(
      source.includes(`\"${field}\"`),
      `Falta ${field} en la petición existente`
    );
  }
  assert.equal(
    (source.match(/requestSevenDayForecast\(/g) ?? [])
      .length,
    2
  );
});
