import {
  createPilotEvent,
  isPilotEvent,
  toPilotEventRow,
  type PilotEvent,
  type PilotEventType,
} from "../engine/pilotTelemetryEngine";

import {
  beginPilotQrAttribution,
  getOrCreatePilotAttribution,
} from "./pilotAttributionRepository";

const PILOT_EVENT_QUEUE_STORAGE_KEY =
  "iguide_pilot_event_queue_v1";

const PILOT_DELIVERED_STORAGE_KEY =
  "iguide_pilot_delivered_events_v1";

const MAXIMUM_QUEUED_EVENTS = 200;
const MAXIMUM_DELIVERED_EVENT_IDS = 300;

let flushInProgress = false;

interface PilotEventDetails {
  experienceId?: string | null;
  outcomeReason?: string | null;
  dedupeKey?: string;
}

interface PilotCollectorConfig {
  endpoint: string;
  anonKey: string;
}

function readJsonStorage(
  key: string
): unknown {
  try {
    const rawValue =
      window.localStorage.getItem(key);

    return rawValue
      ? JSON.parse(rawValue)
      : null;
  } catch {
    return null;
  }
}

function writeJsonStorage(
  key: string,
  value: unknown
): void {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch {
    // La misión sigue funcionando aunque el navegador bloquee storage.
  }
}

function readEventQueue(): PilotEvent[] {
  const stored = readJsonStorage(
    PILOT_EVENT_QUEUE_STORAGE_KEY
  );

  return Array.isArray(stored)
    ? stored.filter(isPilotEvent)
    : [];
}

function readDeliveredEventIds(): string[] {
  const stored = readJsonStorage(
    PILOT_DELIVERED_STORAGE_KEY
  );

  return Array.isArray(stored)
    ? stored.filter(
        (value): value is string =>
          typeof value === "string"
      )
    : [];
}

function enqueuePilotEvent(
  event: PilotEvent
): void {
  const deliveredIds = new Set(
    readDeliveredEventIds()
  );

  if (deliveredIds.has(event.eventId)) {
    return;
  }

  const queue = readEventQueue();

  if (
    queue.some(
      (queuedEvent) =>
        queuedEvent.eventId ===
        event.eventId
    )
  ) {
    return;
  }

  writeJsonStorage(
    PILOT_EVENT_QUEUE_STORAGE_KEY,
    [...queue, event].slice(
      -MAXIMUM_QUEUED_EVENTS
    )
  );
}

function getCollectorConfig():
  | PilotCollectorConfig
  | null {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL
      ?.trim()
      .replace(/\/$/, "");

  const anonKey =
    import.meta.env
      .VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return {
    endpoint:
      `${supabaseUrl}/rest/v1/pilot_events?on_conflict=event_id`,
    anonKey,
  };
}

function markEventsAsDelivered(
  eventIds: string[]
): void {
  const deliveredIds = [
    ...readDeliveredEventIds(),
    ...eventIds,
  ];

  writeJsonStorage(
    PILOT_DELIVERED_STORAGE_KEY,
    [...new Set(deliveredIds)].slice(
      -MAXIMUM_DELIVERED_EVENT_IDS
    )
  );
}

export async function flushPilotEvents():
  Promise<void> {
  if (flushInProgress) {
    return;
  }

  const config = getCollectorConfig();
  const queue = readEventQueue();

  if (
    !config ||
    queue.length === 0 ||
    (typeof navigator !== "undefined" &&
      !navigator.onLine)
  ) {
    return;
  }

  flushInProgress = true;

  try {
    const response = await fetch(
      config.endpoint,
      {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          Authorization:
            `Bearer ${config.anonKey}`,
          "Content-Type":
            "application/json",
          Prefer:
            "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify(
          queue.map(toPilotEventRow)
        ),
      }
    );

    if (!response.ok) {
      return;
    }

    const deliveredEventIds =
      queue.map((event) => event.eventId);

    const deliveredSet = new Set(
      deliveredEventIds
    );

    markEventsAsDelivered(
      deliveredEventIds
    );

    writeJsonStorage(
      PILOT_EVENT_QUEUE_STORAGE_KEY,
      readEventQueue().filter(
        (event) =>
          !deliveredSet.has(event.eventId)
      )
    );
  } catch {
    // La cola local conserva los eventos para el siguiente intento.
  } finally {
    flushInProgress = false;
  }
}

export function recordPilotEvent(
  eventType: PilotEventType,
  details: PilotEventDetails = {}
): PilotEvent {
  const attribution =
    getOrCreatePilotAttribution();

  const event = createPilotEvent({
    eventType,
    visitSessionId:
      attribution.visitSessionId,
    sourceCode: attribution.sourceCode,
    experienceId:
      details.experienceId,
    outcomeReason:
      details.outcomeReason,
    dedupeKey: details.dedupeKey,
    appVersion:
      import.meta.env.VITE_APP_VERSION ??
      "pilot-r5",
  });

  enqueuePilotEvent(event);
  void flushPilotEvents();
  return event;
}

export function recordPilotQrOpened(
  rawSourceCode: string | null | undefined
): boolean {
  const attribution =
    beginPilotQrAttribution(
      rawSourceCode
    );

  if (!attribution) {
    return false;
  }

  const event = createPilotEvent({
    eventType: "qr_opened",
    visitSessionId:
      attribution.visitSessionId,
    sourceCode: attribution.sourceCode,
    dedupeKey: "qr-opened",
    appVersion:
      import.meta.env.VITE_APP_VERSION ??
      "pilot-r5",
  });

  enqueuePilotEvent(event);
  void flushPilotEvents();
  return true;
}
