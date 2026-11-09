import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";

test("el Perfil público no muestra el acceso de edición de fotos en ES ni EN", async () => {
  globalThis.localStorage = {
    getItem: (key) => key === "iguide.lang" ? "es" : null,
    setItem() {},
  };
  globalThis.document = { documentElement: { lang: "es" } };

  const server = await createServer({
    appType: "custom",
    server: { middlewareMode: true, hmr: false },
  });

  try {
    const { default: Profile } = await server.ssrLoadModule("/src/pages/Profile.tsx");
    const { default: i18n } = await server.ssrLoadModule("/src/i18n/index.ts");

    for (const [language, missionsLabel] of [
      ["es", "Explorar nuevas misiones"],
      ["en", "Explore new missions"],
    ]) {
      await i18n.changeLanguage(language);
      const markup = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Profile)));
      assert.ok(markup.includes(missionsLabel), `Perfil renderizado en ${language}`);
      assert.ok(!/Administrar fotos de locales|Manage business photos|\/admin\/locales/i.test(markup),
        `El Perfil en ${language} muestra el acceso al panel de fotos`);
    }
  } finally {
    await server.close();
  }
});
