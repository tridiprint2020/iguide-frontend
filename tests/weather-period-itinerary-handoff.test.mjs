import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  after,
  before,
  test,
} from "node:test";

import { createServer } from "vite";
import en from "../src/i18n/en.ts";

let server;
let createWeatherItinerarySearch;
let getWeatherPeriodViewModels;
let qualifyWeatherPeriod;
let readWeatherItineraryHandoff;

before(async () => {
  server = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({
    createWeatherItinerarySearch,
    getWeatherPeriodViewModels,
    qualifyWeatherPeriod,
    readWeatherItineraryHandoff,
  } = await server.ssrLoadModule(
    "/src/engine/weatherPeriodEngine.ts"
  ));
});

after(async () => {
  await server?.close();
});

function createForecastDay(overrides = {}) {
  return {
    date: "2026-09-08",
    city: "Huancayo",
    condition: "cloudy",
    temperatureMin: 7,
    temperatureMax: 21,
    precipitationProbability: 10,
    windSpeedKmh: 8,
    isHighMountainSafe: true,
    periods: {
      morning: {
        hour: 9,
        temperature: 13,
        apparentTemperature: 12,
        condition: "sunny",
        precipitationProbability: 5,
        windSpeedKmh: 4,
      },
      afternoon: {
        hour: 15,
        temperature: 21,
        apparentTemperature: 20,
        condition: "cloudy",
        precipitationProbability: 10,
        windSpeedKmh: 8,
      },
      night: {
        hour: 21,
        temperature: 11,
        apparentTemperature: 10,
        condition: "cloudy",
        precipitationProbability: 12,
        windSpeedKmh: 6,
      },
    },
    ...overrides,
  };
}

test("martes por la tarde entrega fecha y ventana 15:00–18:00", () => {
  const search = createWeatherItinerarySearch(
    "2026-09-08",
    "afternoon"
  );
  const handoff =
    readWeatherItineraryHandoff(search);

  assert.deepEqual(handoff, {
    date: "2026-09-08",
    period: "afternoon",
    selectedHour: 15,
    endMinutes: 18 * 60,
  });
});

test("cada franja lleva una ventana completa y no solo una hora suelta", () => {
  assert.deepEqual(
    ["morning", "afternoon", "night"].map(
      (period) =>
        readWeatherItineraryHandoff(
          createWeatherItinerarySearch(
            "2026-09-08",
            period
          )
        )
    ),
    [
      {
        date: "2026-09-08",
        period: "morning",
        selectedHour: 9,
        endMinutes: 12 * 60,
      },
      {
        date: "2026-09-08",
        period: "afternoon",
        selectedHour: 15,
        endMinutes: 18 * 60,
      },
      {
        date: "2026-09-08",
        period: "night",
        selectedHour: 19,
        endMinutes: 21 * 60,
      },
    ]
  );
});

test("una franja lluviosa informa que Hospes adaptará el plan", () => {
  const day = createForecastDay({
    periods: {
      ...createForecastDay().periods,
      morning: {
        hour: 9,
        temperature: 12,
        condition: "rain",
        precipitationProbability: 80,
        windSpeedKmh: 9,
      },
    },
  });
  const result = qualifyWeatherPeriod(
    day,
    "morning"
  );

  assert.equal(
    result.decision.action,
    "adapted"
  );
  assert.equal(
    result.decision.reasonCode,
    "wet-weather"
  );
  assert.equal(
    result.statusLabel,
    "Hospes priorizará lugares bajo techo"
  );
});

test("un día limpio califica sus tres franjas desde el mismo motor", () => {
  const periods = getWeatherPeriodViewModels(
    createForecastDay()
  );

  assert.equal(periods.length, 3);
  assert.deepEqual(
    periods.map(
      (period) => period.decision.action
    ),
    ["recommended", "recommended", "recommended"]
  );
});

test("sin pronóstico la franja queda desconocida y conservadora", () => {
  const result = qualifyWeatherPeriod(
    null,
    "afternoon"
  );

  assert.equal(
    result.decision.action,
    "unknown"
  );
  assert.equal(
    result.decision.reasonCode,
    "forecast-unavailable"
  );
  assert.match(
    result.statusLabel,
    /conservador/i
  );
});

test("parámetros inválidos nunca preparan una franja falsa", () => {
  assert.equal(
    readWeatherItineraryHandoff(
      "source=weather&date=2026-02-30&period=morning"
    ),
    null
  );
  assert.equal(
    readWeatherItineraryHandoff(
      "source=weather&date=2026-09-08&period=dawn"
    ),
    null
  );
  assert.equal(
    readWeatherItineraryHandoff(
      "source=map&date=2026-09-08&period=morning"
    ),
    null
  );
});

test("la pantalla semanal consume estados calificados y no decide el clima", () => {
  const source = readFileSync(
    new URL(
      "../src/components/home/HomeWeeklyWeatherDialog.tsx",
      import.meta.url
    ),
    "utf8"
  );

  assert.ok(
    source.includes(
      "getWeatherPeriodViewModels"
    )
  );
  assert.equal(
    /\.precipitationProbability\b/.test(
      source
    ),
    false
  );
  assert.equal(
    /\.condition\b/.test(source),
    false
  );
});

test("todos los textos nuevos tienen versión inglesa", () => {
  const requiredKeys = [
    "Preparar esta franja en el itinerario",
    "Toca una franja para preparar ese momento en tu itinerario.",
    "Pronóstico no disponible",
    "Sin pronóstico: Hospes preparará un plan conservador",
    "Hospes priorizará lugares bajo techo",
    "Hospes evitará la alta montaña",
    "Buen momento para explorar",
    "Clima seleccionado: {{date}} · {{period}} · {{start}}–{{end}}. Elige qué quieres vivir y Hospes organizará esa franja.",
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

test("el handoff reutiliza la caché semanal y no crea otra petición", () => {
  const component = readFileSync(
    new URL(
      "../src/components/home/HomeWeeklyWeatherDialog.tsx",
      import.meta.url
    ),
    "utf8"
  );
  const page = readFileSync(
    new URL(
      "../src/pages/ItineraryPage.tsx",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    component.includes("fetch("),
    false
  );
  assert.equal(page.includes("fetch("), false);
  assert.ok(
    component.includes("fetchSevenDayForecast")
  );
  assert.ok(
    page.includes("fetchSevenDayForecast")
  );
});
