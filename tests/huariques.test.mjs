import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getVerifiedHuariqueProfile,
  getVerifiedHuariques,
  isVerifiedHuarique,
} from "../src/engine/huariqueEngine.ts";
import en from "../src/i18n/en.ts";

function createExperience(overrides = {}) {
  return {
    experienceId: "TEST-HUA-001",
    slug: "huarique-de-prueba",
    title: "Huarique de prueba",
    type: "restaurant",
    city: "Huancayo",
    image: "/test.webp",
    coverImage: "/test.webp",
    description: "Fixture local, no pertenece al catálogo público.",
    latitude: -12.066,
    longitude: -75.21,
    tags: ["tradicional"],
    isActive: true,
    huarique: {
      verified: true,
      reason: "Receta local documentada y atención de sus propietarios.",
      signatureDish: "Mondongo",
      hospesTip: "Pide la bebida de la casa.",
      verifiedAt: "2026-09-03",
      evidenceSource: "ACTA-TEST-001",
    },
    ...overrides,
  };
}

test("huarique conserva su tipo de restaurante y exige evidencia completa", () => {
  const experience = createExperience();
  assert.equal(isVerifiedHuarique(experience), true);
  assert.equal(experience.type, "restaurant");
  assert.equal(
    getVerifiedHuariqueProfile(experience)?.signatureDish,
    "Mondongo"
  );
});

test("una etiqueta informal sin fuente no convierte un negocio en huarique", () => {
  const withoutEvidence = createExperience({
    huarique: {
      verified: true,
      reason: "Parece tradicional.",
      verifiedAt: "2026-09-03",
      evidenceSource: "",
    },
  });
  const onlyTraditionalTags = createExperience({
    experienceId: "TEST-HUA-002",
    huarique: undefined,
    tags: ["tradicional", "local"],
  });

  assert.equal(isVerifiedHuarique(withoutEvidence), false);
  assert.equal(isVerifiedHuarique(onlyTraditionalTags), false);
});

test("un lugar no gastronómico nunca se publica como huarique", () => {
  assert.equal(
    isVerifiedHuarique(
      createExperience({ type: "expedition" })
    ),
    false
  );
});

test("un local inactivo no aparece aunque haya sido verificado", () => {
  assert.equal(
    isVerifiedHuarique(
      createExperience({ isActive: false })
    ),
    false
  );
});

test("la colección devuelve exclusivamente fichas verificadas", () => {
  const verified = createExperience();
  const unverified = createExperience({
    experienceId: "TEST-HUA-002",
    huarique: undefined,
  });
  assert.deepEqual(
    getVerifiedHuariques([unverified, verified]).map(
      (experience) => experience.experienceId
    ),
    ["TEST-HUA-001"]
  );
});

test("el motor no deduce huariques por nombre, tags o cocina", () => {
  const source = readFileSync(
    new URL("../src/engine/huariqueEngine.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /\.tags\b/);
  assert.doesNotMatch(source, /\.cuisine\b/);
  assert.doesNotMatch(source, /\.title\b/);
});

test("los textos públicos de Huariques v1 existen en inglés", () => {
  const requiredKeys = [
    "Huariques",
    "Descubrir huariques",
    "Sabores locales con historia, verificados por I.GUIDE",
    "Huariques de Huancayo",
    "Lugares locales con historia y evidencia, sin dejar de ser restaurantes, cafés o bares.",
    "Huarique verificado",
    "Por qué es un huarique",
    "Plato recomendado",
    "Consejo de Hospes",
    "Aún estamos verificando los primeros huariques de Huancayo.",
    "Mientras tanto, puedes explorar restaurantes y cafés cercanos.",
    "Ver restaurantes cercanos",
  ];

  for (const key of requiredKeys) {
    assert.equal(typeof en[key], "string", `Falta traducción: ${key}`);
  }
});

test("el perfil editorial traduce también el consejo de Hospes", () => {
  assert.equal(
    typeof en["Consejo de Hospes"],
    "string"
  );
});

test("Home y Mapa conectan el acceso con la colección verificada", () => {
  const homeSource = readFileSync(
    new URL("../src/components/HomeLayout.tsx", import.meta.url),
    "utf8"
  );
  const mapSource = readFileSync(
    new URL("../src/pages/MapPage.tsx", import.meta.url),
    "utf8"
  );

  assert.match(homeSource, /\/mapa\?nearby=huariques/);
  assert.match(mapSource, /isVerifiedHuarique/);
  assert.match(mapSource, /getVerifiedHuariques/);
  assert.match(mapSource, /Aún estamos verificando/);
});
