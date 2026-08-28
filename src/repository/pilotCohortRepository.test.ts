import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPilotEvent,
} from "../engine/pilotTelemetryEngine";

import {
  configurePilotTelemetryCohort,
} from "./pilotTelemetryRepository";

import {
  isInternalPilotCohort,
  resolveCurrentPilotSourceCode,
  syncPilotCohortFromUrl,
} from "./pilotCohortRepository";

const COHORT_KEY =
  "iguide_internal_tester_v1";

const QUEUE_KEY =
  "iguide_pilot_event_queue_v1";

function installBrowser(search: string) {
  const values = new Map<
    string,
    string
  >();

  vi.stubGlobal("window", {
    location: {
      search,
    },
    localStorage: {
      getItem: (key: string) =>
        values.get(key) ?? null,
      setItem: (
        key: string,
        value: string
      ) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    },
  });

  return values;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pilotCohortRepository", () => {
  it("persiste el modo interno desde la URL", () => {
    const values = installBrowser(
      "?cohort=internal"
    );

    expect(
      syncPilotCohortFromUrl()
    ).toBe("internal");
    expect(values.get(COHORT_KEY)).toBe(
      "1"
    );
    expect(
      isInternalPilotCohort()
    ).toBe(true);
    expect(
      resolveCurrentPilotSourceCode(
        "wanka-palace"
      )
    ).toBe("test-internal");
  });

  it("devuelve el navegador al tráfico público", () => {
    const values = installBrowser(
      "?cohort=public"
    );
    values.set(COHORT_KEY, "1");

    expect(
      syncPilotCohortFromUrl()
    ).toBe("public");
    expect(
      isInternalPilotCohort()
    ).toBe(false);
    expect(
      resolveCurrentPilotSourceCode(
        "wanka-palace"
      )
    ).toBe("wanka-palace");
  });

  it("reclasifica la cola offline antes de enviarla", () => {
    const values = installBrowser(
      "?cohort=internal"
    );
    const event = createPilotEvent({
      eventType: "mission_started",
      visitSessionId: "visit-1",
      sourceCode: "wanka-palace",
      randomId: () => "event-1",
    });

    values.set(
      QUEUE_KEY,
      JSON.stringify([event])
    );

    configurePilotTelemetryCohort();

    const queue = JSON.parse(
      values.get(QUEUE_KEY) ?? "[]"
    ) as Array<{
      sourceCode: string | null;
    }>;

    expect(queue[0]?.sourceCode).toBe(
      "test-internal"
    );
  });
});
