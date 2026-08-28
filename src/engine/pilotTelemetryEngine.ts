import {
  normalizePilotSourceCode,
} from "./pilotAttributionEngine";

export const PILOT_EVENT_TYPES = [
  "qr_opened",
  "mission_start_requested",
  "mission_started",
  "mission_start_failed",
  "ar_opened",
  "ar_ready",
  "ar_failed",
  "mission_abandoned",
  "mission_certified",
] as const;

export type PilotEventType =
  (typeof PILOT_EVENT_TYPES)[number];

export interface PilotEvent {
  schemaVersion: 1;
  eventId: string;
  eventType: PilotEventType;
  occurredAt: string;
  visitSessionId: string;
  sourceCode: string | null;
  experienceId: string | null;
  outcomeReason: string | null;
  language: string;
  appVersion: string;
}

export interface CreatePilotEventInput {
  eventType: PilotEventType;
  visitSessionId: string;
  sourceCode?: string | null;
  experienceId?: string | null;
  outcomeReason?: string | null;
  dedupeKey?: string;
  occurredAt?: Date;
  language?: string;
  appVersion?: string;
  randomId?: () => string;
}

export interface PilotEventRow {
  schema_version: 1;
  event_id: string;
  event_type: PilotEventType;
  occurred_at: string;
  visit_session_id: string;
  source_code: string | null;
  experience_id: string | null;
  outcome_reason: string | null;
  language: string;
  app_version: string;
}

const SAFE_TOKEN_PATTERN =
  /[^a-zA-Z0-9._:-]/g;

function sanitizeToken(
  value: string | null | undefined,
  maximumLength: number
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(SAFE_TOKEN_PATTERN, "_")
    .slice(0, maximumLength);

  return normalized || null;
}

function getDefaultLanguage(): string {
  if (typeof document !== "undefined") {
    const documentLanguage =
      document.documentElement.lang;

    if (documentLanguage) {
      return documentLanguage;
    }
  }

  if (typeof navigator !== "undefined") {
    return navigator.language;
  }

  return "es";
}

function hashDedupeValue(
  value: string
): string {
  let hash =
    14695981039346656037n;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(
      value.charCodeAt(index)
    );
    hash = BigInt.asUintN(
      64,
      hash * 1099511628211n
    );
  }

  return hash.toString(36);
}

export function getGeolocationOutcomeReason(
  errorCode: number
): string {
  if (errorCode === 1) {
    return "permission_denied";
  }

  if (errorCode === 2) {
    return "position_unavailable";
  }

  if (errorCode === 3) {
    return "timeout";
  }

  return "unknown";
}

export function createPilotEvent(
  input: CreatePilotEventInput
): PilotEvent {
  const visitSessionId =
    sanitizeToken(
      input.visitSessionId,
      80
    ) ?? "invalid-session";

  const experienceId = sanitizeToken(
    input.experienceId,
    120
  );

  const sourceCode =
    normalizePilotSourceCode(
      input.sourceCode
    );

  const outcomeReason = sanitizeToken(
    input.outcomeReason?.toLowerCase(),
    64
  );

  const dedupeKey = sanitizeToken(
    input.dedupeKey,
    100
  );

  const randomId =
    input.randomId ??
    (() => crypto.randomUUID());

  const eventId = dedupeKey
    ? `${input.eventType}:${hashDedupeValue(
        [
          visitSessionId,
          experienceId ?? "none",
          dedupeKey,
        ].join(":")
      )}`
    : sanitizeToken(
        randomId(),
        120
      ) ?? crypto.randomUUID();

  return {
    schemaVersion: 1,
    eventId,
    eventType: input.eventType,
    occurredAt:
      (input.occurredAt ??
        new Date()).toISOString(),
    visitSessionId,
    sourceCode,
    experienceId,
    outcomeReason,
    language:
      sanitizeToken(
        input.language ??
          getDefaultLanguage(),
        16
      ) ?? "es",
    appVersion:
      sanitizeToken(
        input.appVersion ?? "pilot-r5",
        40
      ) ?? "pilot-r5",
  };
}

export function toPilotEventRow(
  event: PilotEvent
): PilotEventRow {
  return {
    schema_version: event.schemaVersion,
    event_id: event.eventId,
    event_type: event.eventType,
    occurred_at: event.occurredAt,
    visit_session_id:
      event.visitSessionId,
    source_code: event.sourceCode,
    experience_id: event.experienceId,
    outcome_reason: event.outcomeReason,
    language: event.language,
    app_version: event.appVersion,
  };
}

export function isPilotEvent(
  value: unknown
): value is PilotEvent {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const candidate = value as Partial<
    PilotEvent
  >;

  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.eventId ===
      "string" &&
    candidate.eventId.length > 0 &&
    candidate.eventId.length <= 240 &&
    PILOT_EVENT_TYPES.includes(
      candidate.eventType as
        PilotEventType
    ) &&
    typeof candidate.occurredAt ===
      "string" &&
    Number.isFinite(
      Date.parse(candidate.occurredAt)
    ) &&
    typeof candidate.visitSessionId ===
      "string" &&
    candidate.visitSessionId.length > 0 &&
    candidate.visitSessionId.length <= 80 &&
    (candidate.sourceCode === null ||
      normalizePilotSourceCode(
        candidate.sourceCode
      ) === candidate.sourceCode) &&
    (candidate.experienceId === null ||
      (typeof candidate.experienceId ===
        "string" &&
        candidate.experienceId.length > 0 &&
        candidate.experienceId.length <= 120)) &&
    (candidate.outcomeReason === null ||
      (typeof candidate.outcomeReason ===
        "string" &&
        candidate.outcomeReason.length > 0 &&
        candidate.outcomeReason.length <= 64)) &&
    typeof candidate.language ===
      "string" &&
    candidate.language.length > 0 &&
    candidate.language.length <= 16 &&
    typeof candidate.appVersion ===
      "string" &&
    candidate.appVersion.length > 0 &&
    candidate.appVersion.length <= 40
  );
}
