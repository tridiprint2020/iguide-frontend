import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PILOT_INTERNAL_SOURCE_CODE,
  normalizePilotCohortCommand,
  resolvePilotCohortSourceCode,
} from "./pilotCohortEngine";

describe("pilotCohortEngine", () => {
  it("acepta únicamente los comandos internos previstos", () => {
    expect(
      normalizePilotCohortCommand(
        " INTERNAL "
      )
    ).toBe("internal");
    expect(
      normalizePilotCohortCommand(
        "public"
      )
    ).toBe("public");
    expect(
      normalizePilotCohortCommand(
        "hotel-casahuanca"
      )
    ).toBeNull();
  });

  it("marca al fundador y testers con una fuente reservada", () => {
    expect(
      resolvePilotCohortSourceCode(
        "wanka-palace",
        true
      )
    ).toBe(PILOT_INTERNAL_SOURCE_CODE);
  });

  it("conserva la atribución comercial en modo público", () => {
    expect(
      resolvePilotCohortSourceCode(
        " Wanka-Palace ",
        false
      )
    ).toBe("wanka-palace");
  });
});
