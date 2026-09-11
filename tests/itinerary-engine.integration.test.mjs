import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createServer } from "vite";
import { FIXTURE_V1_X8B } from "./fixtures/itinerary-v1-x8b.mjs";

let server;
let buildItineraryPlan;
let canCompleteVisitNow;
let catalog;
let getRecommendations;
let getProfilePreferenceScore;
let getExperienceOpeningWindow;
let getScheduleReadiness;
let hasRecommendableSchedule;
let isWetRisky;
let loadSavedItineraries;
let nightclubs;
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
  ({ getRecommendations } =
    await server.ssrLoadModule(
      "/src/engine/recommendationEngine.ts"
    ));
  ({ getProfilePreferenceScore } =
    await server.ssrLoadModule(
      "/src/engine/experienceIntentEngine.ts"
    ));
  ({
    canCompleteVisitNow,
    getExperienceOpeningWindow,
    getScheduleReadiness,
    hasRecommendableSchedule,
  } = await server.ssrLoadModule(
    "/src/engine/experienceScheduleEngine.ts"
  ));
  ({ nightclubs } = await server.ssrLoadModule(
    "/src/data/experiences/nightclubs/nightclubs.ts"
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

test("comer local es un contrato duro y nunca recomienda el Cerrito", () => {
  const cerrito = catalog.find(
    (experience) =>
      experience.experienceId === "EXP-0003"
  );
  const polleria = catalog.find(
    (experience) =>
      experience.experienceId === "RES-0012"
  );

  assert.ok(cerrito);
  assert.ok(polleria);

  const plan = buildItineraryPlan(
    {
      profile,
      location: {
        latitude: polleria.latitude,
        longitude: polleria.longitude,
      },
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 11,
        endMinutes: 14 * 60,
        priorities: ["gastronomy"],
        transport: "walking",
      },
    },
    {
      forecast,
      experiences: [cerrito, polleria],
    }
  );

  assert.ok(plan);
  assert.deepEqual(
    plan.stops.map(
      (stop) => stop.experience.experienceId
    ),
    ["RES-0012"]
  );
  assert.equal(
    plan.stops[0].explanation.reasonCode,
    "interest-match"
  );
});

test("sin comida válida Hospes devuelve un plan vacío en vez de inventar afinidad", () => {
  const cerrito = catalog.find(
    (experience) =>
      experience.experienceId === "EXP-0003"
  );

  assert.ok(cerrito);

  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 11,
        endMinutes: 14 * 60,
        priorities: ["gastronomy"],
        transport: "walking",
      },
    },
    { forecast, experiences: [cerrito] }
  );

  assert.ok(plan);
  assert.equal(plan.stops.length, 0);
});

test("historia y cultura reconoce la identidad cultural sin aceptar un mirador", () => {
  const cerrito = catalog.find(
    (experience) =>
      experience.experienceId === "EXP-0003"
  );
  const parque = catalog.find(
    (experience) =>
      experience.experienceId === "EXP-0004"
  );

  assert.ok(cerrito);
  assert.ok(parque);

  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 9,
        endMinutes: 14 * 60,
        priorities: ["culture"],
        transport: "walking",
      },
    },
    { forecast, experiences: [cerrito, parque] }
  );

  assert.ok(plan);
  assert.deepEqual(
    plan.stops.map(
      (stop) => stop.experience.experienceId
    ),
    ["EXP-0004"]
  );
});

test("el motor general usa el mismo contrato duro de comer local", () => {
  const recommendations = getRecommendations({
    profile,
    answers: {
      selectedDate: "2026-09-13",
      selectedHour: 11,
      endMinutes: 14 * 60,
      priorities: ["gastronomy"],
      transport: "walking",
    },
  });

  assert.ok(recommendations.length > 0);
  assert.ok(
    recommendations.every((experience) =>
      ["restaurant", "cafe", "food_route"].includes(
        experience.type
      )
    )
  );
});

test("la afinidad gastronómica legacy no convierte una expedición en comida", () => {
  const cerrito = catalog.find(
    (experience) =>
      experience.experienceId === "EXP-0003"
  );
  const polleria = catalog.find(
    (experience) =>
      experience.experienceId === "RES-0012"
  );

  assert.ok(cerrito);
  assert.ok(polleria);
  assert.equal(
    getProfilePreferenceScore(
      cerrito,
      ["gastronomy"]
    ),
    0
  );
  assert.ok(
    getProfilePreferenceScore(
      polleria,
      ["gastronomy"]
    ) > 0
  );
});

test("vida nocturna y artesanía respetan categorías exactas", () => {
  const contracts = [
    {
      priority: "nightlife",
      acceptedTypes: ["bar", "nightclub"],
      selectedHour: 19,
    },
    {
      priority: "crafts",
      acceptedTypes: ["craft"],
      selectedHour: 10,
    },
  ];

  for (const contract of contracts) {
    const recommendations = getRecommendations({
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: contract.selectedHour,
        endMinutes: 21 * 60,
        priorities: [contract.priority],
        transport: "walking",
      },
    });

    assert.ok(
      recommendations.length > 0,
      contract.priority
    );
    assert.ok(
      recommendations.every((experience) =>
        contract.acceptedTypes.includes(
          experience.type
        )
      ),
      contract.priority
    );
  }

  const festivals = getRecommendations({
    profile,
    answers: {
      selectedDate: "2026-09-13",
      selectedHour: 19,
      endMinutes: 21 * 60,
      priorities: ["festivals"],
      transport: "walking",
    },
  });
  assert.deepEqual(festivals, []);
});

test("vida nocturna lluviosa conserva Cava, Galileo y Azotea porque son interiores", () => {
  const rainyNight = {
    ...forecast,
    condition: "rain",
    precipitationProbability: 80,
    periods: {
      ...forecast.periods,
      night: {
        ...forecast.periods.night,
        condition: "rain",
        precipitationProbability: 80,
      },
    },
  };
  const plan = buildItineraryPlan(
    {
      profile,
      location: {
        latitude: -12.068018431794457,
        longitude: -75.20950274213135,
      },
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 18,
        endMinutes: 24 * 60,
        priorities: ["nightlife"],
        transport: "walking",
      },
    },
    { forecast: rainyNight, experiences: catalog }
  );

  assert.ok(plan);
  assert.deepEqual(
    plan.stops.map(
      (stop) => stop.experience.experienceId
    ),
    ["BAR-0001", "BAR-0002", "BAR-0003"]
  );
  assert.deepEqual(
    plan.exclusions.map((item) => [
      item.experienceId,
      item.explanation.reasonCode,
    ]),
    []
  );
});

test("los descartes pertenecen únicamente a la intención elegida", () => {
  const rainyNight = {
    ...forecast,
    condition: "rain",
    precipitationProbability: 80,
    periods: {
      ...forecast.periods,
      night: {
        ...forecast.periods.night,
        condition: "rain",
        precipitationProbability: 80,
      },
    },
  };
  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 19,
        endMinutes: 21 * 60,
        priorities: ["nightlife"],
        transport: "walking",
      },
    },
    { forecast: rainyNight, experiences: catalog }
  );

  assert.ok(plan);
  const byId = new Map(
    catalog.map((experience) => [
      experience.experienceId,
      experience,
    ])
  );
  assert.ok(
    plan.exclusions.every((item) =>
      ["bar", "nightclub"].includes(
        byId.get(item.experienceId)?.type
      )
    )
  );
});

test("El San queda eliminado y los tres nightclubs aprobados entran recomendables", () => {
  assert.equal(
    catalog.some(
      (experience) =>
        experience.experienceId === "EVE-0001" ||
        experience.slug === "el-san"
    ),
    false
  );
  assert.ok(Array.isArray(nightclubs));
  assert.equal(nightclubs.length, 3);
  assert.ok(
    nightclubs.every(
      (experience) =>
        experience.isActive === true &&
        experience.type === "nightclub"
    )
  );
  assert.deepEqual(
    nightclubs.map(
      (experience) => experience.experienceId
    ),
    ["NGT-0001", "NGT-0002", "NGT-0003"]
  );
  assert.ok(
    nightclubs.every((experience) =>
      catalog.some(
        (candidate) =>
          candidate.experienceId ===
          experience.experienceId
      )
    )
  );
  assert.ok(
    nightclubs.every(
      (experience) =>
        getScheduleReadiness(experience) ===
        "ready"
    )
  );
});

test("Taj Mahal, Insomnio y Mr. Juerga conservan los datos operativos verificados", () => {
  const expected = [
    {
      id: "NGT-0001",
      coordinates: [
        -12.075932451832939,
        -75.21127489404162,
      ],
      days: [0, 2, 3, 4, 5, 6],
      opensAt: "20:00",
      closesAt: "03:00",
      averagePricePen: 100,
      verifiedAt: "2026-06",
    },
    {
      id: "NGT-0002",
      coordinates: [
        -12.073339811248584,
        -75.20938519728494,
      ],
      days: [4, 5, 6],
      opensAt: "21:00",
      closesAt: "05:00",
      averagePricePen: 150,
      verifiedAt: "2026-09-04",
    },
    {
      id: "NGT-0003",
      coordinates: [
        -12.068115087022154,
        -75.2146304854011,
      ],
      days: [0, 1, 2, 3, 4, 5, 6],
      opensAt: "18:00",
      closesAt: "04:00",
      averagePricePen: 150,
      verifiedAt: "2026-08-28",
    },
  ];

  for (const item of expected) {
    const experience = nightclubs.find(
      (candidate) =>
        candidate.experienceId === item.id
    );

    assert.ok(experience, item.id);
    assert.deepEqual(
      [experience.latitude, experience.longitude],
      item.coordinates
    );
    assert.deepEqual(experience.weeklySchedule, {
      days: item.days,
      opensAt: item.opensAt,
      closesAt: item.closesAt,
      closedOnHolidays: false,
    });
    assert.equal(experience.environment, "indoor");
    assert.equal(experience.estimatedVisitMinutes, 180);
    assert.equal(
      experience.averagePricePen,
      item.averagePricePen
    );
    assert.deepEqual(
      experience.paymentMethods,
      ["cash", "yape", "card"]
    );
    assert.equal(experience.admissionRequired, true);
    assert.equal(
      typeof experience.hospesTip,
      "string"
    );
    assert.ok(experience.hospesTip.length > 0);
    assert.equal(
      experience.operationalVerification?.verifiedAt,
      item.verifiedAt
    );
  }
});

test("un turno nocturno sigue abierto después de medianoche si comenzó el día anterior", () => {
  const tajMahal = nightclubs.find(
    (experience) =>
      experience.experienceId === "NGT-0001"
  );
  const insomnio = nightclubs.find(
    (experience) =>
      experience.experienceId === "NGT-0002"
  );

  assert.ok(tajMahal);
  assert.ok(insomnio);

  // Lunes 00:00 todavía pertenece al turno dominical de Taj Mahal.
  assert.equal(
    canCompleteVisitNow(
      tajMahal,
      new Date(2026, 8, 14, 0, 0)
    ),
    true
  );

  // Domingo 00:30 todavía pertenece al turno sabatino de Insomnio.
  assert.equal(
    canCompleteVisitNow(
      insomnio,
      new Date(2026, 8, 20, 0, 30)
    ),
    true
  );

  // Jueves 00:30 aún no pertenece al turno del jueves: el miércoles cerró.
  assert.equal(
    canCompleteVisitNow(
      insomnio,
      new Date(2026, 8, 17, 0, 30)
    ),
    false
  );
});

test("todos los candidatos activos declaran su relación con clima y ambiente", () => {
  const candidates = catalog.filter(
    (experience) => experience.type !== "hotel"
  );
  const incomplete = candidates
    .filter(
      (experience) =>
        !experience.environment ||
        !experience.weatherSensitivity
    )
    .map((experience) => experience.title);

  assert.deepEqual(incomplete, []);
});

test("24:00 es un cierre válido y no convierte T'ika en un local sin horario", () => {
  const tika = catalog.find(
    (experience) =>
      experience.experienceId === "CAF-0003"
  );

  assert.ok(tika);
  assert.deepEqual(
    getExperienceOpeningWindow(
      tika,
      "2026-09-13"
    ),
    {
      hasSchedule: true,
      isScheduledToday: true,
      opensAt: 11 * 60,
      closesAt: 24 * 60,
    }
  );
});

test("La Serranita y Polares usan los horarios y puertas verificados por el Fundador", () => {
  const expected = [
    {
      id: "CAF-0101",
      coordinates: [
        -12.067779937071837,
        -75.20962107923576,
      ],
      opensAt: "09:00",
      closesAt: "21:00",
      closedOnHolidays: false,
      verifiedAt: "2026-09-08",
    },
    {
      id: "CAF-0102",
      coordinates: [
        -12.062358635910979,
        -75.20661775767118,
      ],
      opensAt: "11:00",
      closesAt: "18:30",
      closedOnHolidays: true,
      verifiedAt: "2026-08-28",
    },
  ];

  for (const item of expected) {
    const experience = catalog.find(
      (candidate) =>
        candidate.experienceId === item.id
    );
    assert.ok(experience, item.id);
    assert.deepEqual(
      [experience.latitude, experience.longitude],
      item.coordinates
    );
    assert.deepEqual(experience.weeklySchedule, {
      days: [0, 1, 2, 3, 4, 5, 6],
      opensAt: item.opensAt,
      closesAt: item.closesAt,
      closedOnHolidays: item.closedOnHolidays,
    });
    assert.equal(experience.estimatedVisitMinutes, 60);
    assert.equal(experience.environment, "indoor");
    assert.equal(
      experience.operationalVerification?.verifiedAt,
      item.verifiedAt
    );
    assert.equal(
      hasRecommendableSchedule(experience),
      true,
      item.id
    );
  }
});

test("las temporadas están estructuradas, pero fiestas sin punto y hora fijos siguen informativas", () => {
  const expected = [
    {
      id: "FES-0001",
      start: { month: 7, day: 24 },
      end: { month: 9, endOfMonth: true },
      locationScope: "citywide",
      rainPolicy: "continues",
      visitMinutes: 300,
    },
    {
      id: "FES-0002",
      start: { month: 6, day: 1 },
      end: { month: 6, day: 7 },
      locationScope: "citywide",
      rainPolicy: "continues",
      visitMinutes: 360,
    },
    {
      id: "FES-0003",
      start: { month: 2, day: 13 },
      end: { month: 2, endOfMonth: true },
      locationScope: "route-and-citywide",
      rainPolicy: "continues",
      visitMinutes: 300,
    },
  ];

  for (const item of expected) {
    const experience = catalog.find(
      (candidate) =>
        candidate.experienceId === item.id
    );
    assert.ok(experience, item.id);
    assert.equal(experience.type, "festival");
    assert.deepEqual(
      experience.annualSchedule?.start,
      item.start
    );
    assert.deepEqual(
      experience.annualSchedule?.end,
      item.end
    );
    assert.equal(
      experience.annualSchedule?.timing.kind,
      "variable"
    );
    assert.equal(
      experience.annualSchedule?.locationScope,
      item.locationScope
    );
    assert.equal(
      experience.annualSchedule?.rainPolicy,
      item.rainPolicy
    );
    assert.equal(
      experience.estimatedVisitMinutes,
      item.visitMinutes
    );
    assert.equal(
      getScheduleReadiness(experience),
      "variable"
    );
    assert.equal(
      hasRecommendableSchedule(experience),
      false
    );
  }

  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 9,
        endMinutes: 14 * 60,
        priorities: ["festivals"],
        transport: "walking",
      },
    },
    { forecast, experiences: catalog }
  );

  assert.ok(plan);
  assert.equal(plan.stops.length, 0);
  assert.ok(
    plan.exclusions.length > 0 &&
      plan.exclusions.every(
        (item) =>
          item.explanation.reasonCode ===
          "schedule-variable"
      )
  );
});

test("una festividad futura con fecha, hora y recorrido fijos puede entrar solo en temporada", () => {
  const baseFestival = catalog.find(
    (candidate) =>
      candidate.experienceId === "FES-0003"
  );
  assert.ok(baseFestival);
  assert.equal(baseFestival.type, "festival");

  const fixedFestival = {
    ...baseFestival,
    annualSchedule: {
      recursAnnually: true,
      start: { month: 2, day: 13 },
      end: { month: 2, day: 13 },
      timing: { kind: "all-day" },
      locationScope: "route",
      locationDescription:
        "Recorrido anual confirmado.",
      rainPolicy: "continues",
    },
  };

  assert.equal(
    getScheduleReadiness(fixedFestival),
    "ready"
  );
  assert.deepEqual(
    getExperienceOpeningWindow(
      fixedFestival,
      "2027-02-13"
    ),
    {
      hasSchedule: true,
      isScheduledToday: true,
      opensAt: 0,
      closesAt: 24 * 60,
    }
  );
  assert.equal(
    getExperienceOpeningWindow(
      fixedFestival,
      "2027-02-14"
    ).isScheduledToday,
    false
  );
});

test("el motor general comparte clima, horario y cercanía con Hospes", () => {
  const rainyWeather = {
    city: "Huancayo",
    condition: "rain",
    temperature: 12,
    precipitationProbabilityNext3Hours: 80,
    windSpeedKmh: 4,
    isHighMountainSafe: true,
  };
  const recommendations = getRecommendations(
    {
      profile,
      location: {
        latitude: -12.069724748253861,
        longitude: -75.21269449551589,
      },
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 19,
        endMinutes: 23 * 60,
        priorities: ["nightlife"],
        transport: "walking",
      },
    },
    {
      weather: rainyWeather,
      experiences: catalog,
    }
  );

  assert.deepEqual(
    recommendations.map(
      (experience) => experience.experienceId
    ),
    ["BAR-0002", "NGT-0003", "BAR-0003", "BAR-0001"]
  );

  const dryRecommendations = getRecommendations(
    {
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 19,
        endMinutes: 23 * 60,
        priorities: ["nightlife"],
        transport: "walking",
      },
    },
    {
      weather: {
        ...rainyWeather,
        condition: "sunny",
        precipitationProbabilityNext3Hours: 0,
      },
      experiences: catalog,
    }
  );
  assert.deepEqual(
    dryRecommendations.map(
      (experience) => experience.experienceId
    ),
    ["BAR-0001", "BAR-0002", "BAR-0003", "NGT-0003"]
  );

  const saturdayRecommendations = getRecommendations(
    {
      profile,
      answers: {
        selectedDate: "2026-09-19",
        selectedHour: 21,
        endMinutes: 24 * 60,
        priorities: ["nightlife"],
        transport: "walking",
      },
    },
    {
      weather: {
        ...rainyWeather,
        condition: "sunny",
        precipitationProbabilityNext3Hours: 0,
      },
      experiences: catalog,
    }
  );
  assert.deepEqual(
    saturdayRecommendations
      .filter(
        (experience) =>
          experience.type === "nightclub"
      )
      .map(
        (experience) =>
          experience.experienceId
      ),
    ["NGT-0001", "NGT-0002", "NGT-0003"]
  );

  const cava = catalog.find(
    (experience) =>
      experience.experienceId === "BAR-0001"
  );
  const galileo = catalog.find(
    (experience) =>
      experience.experienceId === "BAR-0002"
  );
  assert.ok(cava);
  assert.ok(galileo);
  assert.equal(
    canCompleteVisitNow(
      cava,
      new Date(2026, 8, 13, 20, 30)
    ),
    false
  );
  assert.equal(
    canCompleteVisitNow(
      galileo,
      new Date(2026, 8, 13, 20, 30)
    ),
    true
  );
});

test("Sorpréndeme explica compatibilidad y no finge coincidencia de interés", () => {
  const cerrito = catalog.find(
    (experience) =>
      experience.experienceId === "EXP-0003"
  );

  assert.ok(cerrito);

  const plan = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 9,
        endMinutes: 12 * 60,
        priorities: ["surprise"],
        transport: "walking",
      },
    },
    { forecast, experiences: [cerrito] }
  );

  assert.ok(plan);
  assert.equal(plan.stops.length, 1);
  assert.equal(
    plan.stops[0].explanation.reasonCode,
    "weather-compatible"
  );
});

test("la ubicación conocida calcula también el primer traslado de una expedición", () => {
  const cerrito = catalog.find(
    (experience) =>
      experience.experienceId === "EXP-0003"
  );

  assert.ok(cerrito);

  const withLocation = buildItineraryPlan(
    {
      profile,
      location: {
        latitude: cerrito.latitude,
        longitude: cerrito.longitude,
      },
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 9,
        endMinutes: 12 * 60,
        priorities: ["photography"],
        transport: "walking",
      },
    },
    { forecast, experiences: [cerrito] }
  );
  const withoutLocation = buildItineraryPlan(
    {
      profile,
      answers: {
        selectedDate: "2026-09-13",
        selectedHour: 9,
        endMinutes: 12 * 60,
        priorities: ["photography"],
        transport: "walking",
      },
    },
    { forecast, experiences: [cerrito] }
  );

  assert.ok(withLocation);
  assert.ok(withoutLocation);
  assert.equal(
    withLocation.stops[0].travelMinutes,
    2
  );
  assert.equal(
    withoutLocation.stops[0].travelMinutes,
    25
  );
});
