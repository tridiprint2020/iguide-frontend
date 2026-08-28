import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPilotAttribution,
  isPilotAttributionActive,
  normalizePilotSourceCode,
  shouldReuseQrAttribution,
} from "./pilotAttributionEngine";

describe("pilotAttributionEngine", () => {
  it("normaliza únicamente códigos QR seguros", () => {
    expect(
      normalizePilotSourceCode(
        " Wanka-Palace "
      )
    ).toBe("wanka-palace");

    expect(
      normalizePilotSourceCode(
        "../../correo@privado"
      )
    ).toBeNull();
  });

  it("mantiene una atribución durante su vigencia", () => {
    const attribution =
      createPilotAttribution(
        "wanka-palace",
        1000,
        "session-1"
      );

    expect(
      isPilotAttributionActive(
        attribution,
        2000
      )
    ).toBe(true);
  });

  it("reutiliza el mismo escaneo durante el doble montaje", () => {
    const attribution =
      createPilotAttribution(
        "wanka-palace",
        1000,
        "session-1"
      );

    expect(
      shouldReuseQrAttribution(
        attribution,
        "wanka-palace",
        2000
      )
    ).toBe(true);

    expect(
      shouldReuseQrAttribution(
        attribution,
        "otro-hotel",
        2000
      )
    ).toBe(false);
  });
});
