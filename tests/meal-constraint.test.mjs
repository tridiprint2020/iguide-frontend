import assert from "node:assert/strict";
import test from "node:test";
import { explainMealConstraint } from "../src/engine/itineraryTimePolicyEngine.ts";
import { migrateItinerarySnapshot } from "../src/engine/itinerarySnapshotMigrationEngine.ts";
import { FIXTURE_V1_X8B } from "./fixtures/itinerary-v1-x8b.mjs";

const base = { experienceType: "cafe", earliestMinutes: 966,
  usedSlots: new Set(["snack"]), visitMinutes: 60, endMinutes: 1080,
  opensAt: 480, closesAt: 1260 };

test("franja cubierta solo si la visita cabría sin la comida previa, incluido cierre exacto", () => {
  assert.equal(explainMealConstraint(base), "slot-covered");
  assert.equal(explainMealConstraint({ ...base, endMinutes: 1026 }), "slot-covered");
  assert.equal(explainMealConstraint({ ...base, endMinutes: 1025 }), undefined);
  assert.equal(explainMealConstraint({ ...base, opensAt: 1050 }), undefined);
  assert.equal(explainMealConstraint({ ...base, closesAt: 1000 }), undefined);
  assert.equal(explainMealConstraint({ ...base, visitMinutes: 180 }), undefined);
});

test("la cena al fin exacto está fuera del plan; una cena que empieza dentro conserva falta real de tiempo", () => {
  const dinner = { ...base, experienceType: "restaurant", usedSlots: new Set() };
  assert.equal(explainMealConstraint(dinner), "next-slot-outside-plan");
  assert.equal(explainMealConstraint({ ...dinner, endMinutes: 1079 }), "next-slot-outside-plan");
  assert.equal(explainMealConstraint({ ...dinner, endMinutes: 1081 }), undefined);
  assert.equal(explainMealConstraint({ ...base, usedSlots: new Set(), allowedSlots: [] }), undefined);
});

test("los detalles de comida sobreviven al snapshot sin códigos nuevos ni pérdida del fixture V1", () => {
  const snapshot = migrateItinerarySnapshot(FIXTURE_V1_X8B);
  snapshot.exclusions = ["slot-covered", "next-slot-outside-plan"].map((mealConstraint) => ({
    experienceId: mealConstraint, title: "Fixture",
    explanation: { action: "excluded", reasonCode: "not-enough-time", params: { mealConstraint } },
  }));
  assert.deepEqual(migrateItinerarySnapshot(JSON.parse(JSON.stringify(snapshot))), snapshot);
  assert.equal(snapshot.stops.length, 8);
});
