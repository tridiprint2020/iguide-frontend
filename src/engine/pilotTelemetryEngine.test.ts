import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPilotEvent,
  getGeolocationOutcomeReason,
  toPilotEventRow,
  isPilotEvent,
} from "./pilotTelemetryEngine";

describe("pilotTelemetryEngine", () => {
  it("genera un identificador estable cuando recibe dedupeKey", () => {
    const input = {
      eventType:
        "mission_certified" as const,
      visitSessionId: "visit-1",
      experienceId: "parque-identidad",
      dedupeKey: "journey-25",
      occurredAt:
        new Date("2026-08-22T12:00:00Z"),
    };

    expect(
      createPilotEvent(input).eventId
    ).toBe(
      createPilotEvent(input).eventId
    );

    expect(
      createPilotEvent({
        ...input,
        visitSessionId: "v".repeat(80),
        experienceId: "e".repeat(120),
        dedupeKey: "d".repeat(100),
      }).eventId.length
    ).toBeLessThanOrEqual(240);
  });

  it("solo serializa campos permitidos y nunca coordenadas", () => {
    const row = toPilotEventRow(
      createPilotEvent({
        eventType: "mission_started",
        visitSessionId: "visit-1",
        sourceCode: "wanka-palace",
        experienceId:
          "parque-identidad",
        randomId: () => "event-1",
      })
    );

    expect(row).toEqual(
      expect.objectContaining({
        event_id: "event-1",
        source_code: "wanka-palace",
        experience_id:
          "parque-identidad",
      })
    );

    expect(row).not.toHaveProperty(
      "latitude"
    );
    expect(row).not.toHaveProperty(
      "longitude"
    );
    expect(row).not.toHaveProperty("photo");
    expect(row).not.toHaveProperty("note");
    expect(row).not.toHaveProperty("email");
  });

  it("reduce errores GPS a razones no sensibles", () => {
    expect(
      getGeolocationOutcomeReason(1)
    ).toBe("permission_denied");
    expect(
      getGeolocationOutcomeReason(2)
    ).toBe("position_unavailable");
    expect(
      getGeolocationOutcomeReason(3)
    ).toBe("timeout");
  });

  it("descarta eventos corruptos que bloquearían la cola", () => {
    const validEvent =
      createPilotEvent({
        eventType: "ar_ready",
        visitSessionId: "visit-1",
        randomId: () => "event-1",
      });

    expect(
      isPilotEvent(validEvent)
    ).toBe(true);

    expect(
      isPilotEvent({
        ...validEvent,
        eventId: "",
      })
    ).toBe(false);

    expect(
      isPilotEvent({
        ...validEvent,
        sourceCode: "../invalido",
      })
    ).toBe(false);
  });
});
