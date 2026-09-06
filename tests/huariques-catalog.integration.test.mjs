import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let buildItineraryPlan;
let catalog;
let getExperienceOpeningStatus;
let getExperienceScheduleLabel;
let getVerifiedHuariques;
let server;

const profile = {
  name: "Fixture Huariques",
  firstVisit: true,
  returnPointOnboardingComplete: true,
  travelMode: "solo",
  interests: ["gastronomy"],
  level: 1,
  experience: 0,
  visitedExperiences: [],
  achievements: [],
  favorites: [],
};

function createContext({ selectedDate, selectedHour, endMinutes, location }) {
  return {
    profile,
    location,
    answers: {
      selectedDate,
      selectedHour,
      endMinutes,
      priorities: ["gastronomy"],
      transport: "walking",
    },
  };
}

before(async () => {
  globalThis.localStorage = {
    getItem: () => "es",
    setItem: () => undefined,
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { language: "es-PE" },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { documentElement: { lang: "es" } },
  });

  server = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ catalog } = await server.ssrLoadModule("/src/data/catalog/index.ts"));
  ({ getVerifiedHuariques } = await server.ssrLoadModule(
    "/src/engine/huariqueEngine.ts"
  ));
  ({ getExperienceOpeningStatus, getExperienceScheduleLabel } =
    await server.ssrLoadModule("/src/engine/experienceScheduleEngine.ts"));
  ({ buildItineraryPlan } = await server.ssrLoadModule(
    "/src/engine/itineraryEngine.ts"
  ));
});

after(async () => {
  await server?.close();
});

test("el catálogo expone cinco locales y una ruta verificados por el Fundador", () => {
  const huariques = getVerifiedHuariques(catalog);

  assert.deepEqual(
    huariques.map((experience) => experience.title),
    [
      "Los Girasoles",
      "El Padrinazo",
      "El Braserito",
      "Restaurant Campestre Valle Azul",
      "La Casa – Los Conquistadores",
      "Ruta del lechón de Chupaca",
    ]
  );
  assert.ok(
    huariques.every(
      (experience) =>
        ["restaurant", "food_route"].includes(experience.type) &&
        experience.huarique.verified === true &&
        experience.address &&
        experience.weeklySchedule &&
        experience.estimatedVisitMinutes
    )
  );
});

test("la Ruta del lechón conserva su identidad colectiva y su precio desde cinco soles", () => {
  const route = catalog.find(
    (experience) => experience.slug === "ruta-del-lechon-de-chupaca"
  );

  assert.ok(route);
  assert.equal(route.type, "food_route");
  assert.equal(route.vendorModel, "collective");
  assert.equal(route.priceFromPen, 5);
  assert.equal(route.estimatedVisitMinutes, 120);
  assert.equal(
    getExperienceScheduleLabel(route),
    "Sáb–Dom · 07:00–14:00 · hasta agotar existencias"
  );
});

test("la Ruta del lechón entra el sábado por la mañana y queda fuera un martes", () => {
  const route = catalog.find(
    (experience) => experience.slug === "ruta-del-lechon-de-chupaca"
  );
  assert.ok(route);

  const saturdayPlan = buildItineraryPlan(
    createContext({
      selectedDate: "2026-09-05",
      selectedHour: 7,
      endMinutes: 11 * 60,
      location: {
        latitude: route.latitude,
        longitude: route.longitude,
      },
    }),
    { forecast: null, experiences: [route] }
  );
  const tuesdayPlan = buildItineraryPlan(
    createContext({
      selectedDate: "2026-09-08",
      selectedHour: 7,
      endMinutes: 11 * 60,
      location: {
        latitude: route.latitude,
        longitude: route.longitude,
      },
    }),
    { forecast: null, experiences: [route] }
  );

  assert.ok(saturdayPlan);
  assert.equal(
    saturdayPlan.stops[0]?.experience.slug,
    "ruta-del-lechon-de-chupaca"
  );
  assert.ok(tuesdayPlan);
  assert.equal(tuesdayPlan.stops.length, 0);
  assert.equal(
    tuesdayPlan.exclusions[0]?.explanation.reasonCode,
    "outside-opening-hours"
  );
});

test("la Ruta del lechón todavía puede organizarse al mediodía si quedan existencias", () => {
  const route = catalog.find(
    (experience) => experience.slug === "ruta-del-lechon-de-chupaca"
  );
  assert.ok(route);

  const plan = buildItineraryPlan(
    createContext({
      selectedDate: "2026-09-05",
      selectedHour: 11,
      endMinutes: 14 * 60,
      location: {
        latitude: route.latitude,
        longitude: route.longitude,
      },
    }),
    { forecast: null, experiences: [route] }
  );

  assert.ok(plan);
  assert.equal(
    plan.stops[0]?.experience.slug,
    "ruta-del-lechon-de-chupaca"
  );
});

test("los datos estructurales conservan precios, pagos, duraciones y coordenadas", () => {
  const expected = new Map([
    ["el-padrinazo", [30, 45, -12.069155261880008, -75.20726025397761]],
    ["el-braserito", [30, 60, -12.073709750427867, -75.20812441988363]],
    ["los-girasoles", [50, 90, -12.064901145614282, -75.21501080463344]],
    ["restaurant-campestre-valle-azul", [40, 150, -11.8900916, -75.2905327]],
    ["la-casa-los-conquistadores", [25, 60, -12.069785889274364, -75.20839458880786]],
  ]);

  for (const [slug, values] of expected) {
    const experience = catalog.find((item) => item.slug === slug);
    assert.ok(experience, `Falta ${slug}`);
    assert.equal(experience.averagePricePen, values[0]);
    assert.equal(experience.estimatedVisitMinutes, values[1]);
    assert.equal(experience.latitude, values[2]);
    assert.equal(experience.longitude, values[3]);
    assert.ok(experience.paymentMethods.length >= 2);
  }
});

test("el horario semanal impide recomendar El Padrinazo un domingo", () => {
  const padrinazo = catalog.find((item) => item.slug === "el-padrinazo");
  assert.ok(padrinazo);

  const status = getExperienceOpeningStatus(
    padrinazo,
    new Date(2026, 8, 6, 9, 0)
  );
  assert.equal(status.hasSchedule, true);
  assert.equal(status.isScheduledToday, false);
  assert.equal(status.isOpen, false);

  const plan = buildItineraryPlan(
    createContext({
      selectedDate: "2026-09-06",
      selectedHour: 8,
      endMinutes: 11 * 60,
      location: {
        latitude: padrinazo.latitude,
        longitude: padrinazo.longitude,
      },
    }),
    { forecast: null, experiences: [padrinazo] }
  );

  assert.ok(plan);
  assert.equal(plan.stops.length, 0);
  assert.equal(plan.exclusions[0]?.explanation.reasonCode, "outside-opening-hours");
});

test("El Padrinazo puede ocupar el desayuno de un sábado", () => {
  const padrinazo = catalog.find((item) => item.slug === "el-padrinazo");
  assert.ok(padrinazo);

  const plan = buildItineraryPlan(
    createContext({
      selectedDate: "2026-09-05",
      selectedHour: 7,
      endMinutes: 10 * 60,
      location: {
        latitude: padrinazo.latitude,
        longitude: padrinazo.longitude,
      },
    }),
    { forecast: null, experiences: [padrinazo] }
  );

  assert.ok(plan);
  assert.equal(plan.stops[0]?.experience.slug, "el-padrinazo");
  assert.equal(
    getExperienceScheduleLabel(padrinazo),
    "Lun–Sáb · 07:00–15:00 · feriados cerrado"
  );
});

test("El Braserito solo entra en su ventana nocturna declarada", () => {
  const braserito = catalog.find((item) => item.slug === "el-braserito");
  assert.ok(braserito);

  const plan = buildItineraryPlan(
    createContext({
      selectedDate: "2026-09-05",
      selectedHour: 17,
      endMinutes: 21 * 60,
      location: {
        latitude: braserito.latitude,
        longitude: braserito.longitude,
      },
    }),
    { forecast: null, experiences: [braserito] }
  );

  assert.ok(plan);
  assert.equal(plan.stops[0]?.experience.slug, "el-braserito");
  assert.ok(plan.stops[0].startMinutes >= 18 * 60);
  assert.equal(
    getExperienceScheduleLabel(braserito),
    "Todos los días · 16:00–22:30 · feriados cerrado"
  );
});
