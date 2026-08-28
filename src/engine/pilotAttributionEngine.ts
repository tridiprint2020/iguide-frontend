export const PILOT_ATTRIBUTION_TTL_MS =
  24 * 60 * 60 * 1000;

export const PILOT_QR_REOPEN_WINDOW_MS =
  30 * 1000;

export interface PilotAttribution {
  visitSessionId: string;
  sourceCode: string | null;
  startedAt: number;
  expiresAt: number;
}

const PILOT_SOURCE_CODE_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function normalizePilotSourceCode(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase();

  return PILOT_SOURCE_CODE_PATTERN.test(
    normalized
  )
    ? normalized
    : null;
}

export function isPilotAttributionActive(
  attribution: PilotAttribution,
  now = Date.now()
): boolean {
  return (
    attribution.startedAt <= now &&
    attribution.expiresAt > now
  );
}

export function shouldReuseQrAttribution(
  attribution: PilotAttribution | null,
  sourceCode: string,
  now = Date.now()
): boolean {
  return Boolean(
    attribution &&
      attribution.sourceCode ===
        sourceCode &&
      isPilotAttributionActive(
        attribution,
        now
      ) &&
      now - attribution.startedAt <=
        PILOT_QR_REOPEN_WINDOW_MS
  );
}

export function createPilotAttribution(
  sourceCode: string | null,
  now: number,
  visitSessionId: string
): PilotAttribution {
  return {
    visitSessionId,
    sourceCode,
    startedAt: now,
    expiresAt:
      now + PILOT_ATTRIBUTION_TTL_MS,
  };
}

export function isPilotAttribution(
  value: unknown
): value is PilotAttribution {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const candidate = value as Partial<
    PilotAttribution
  >;

  return (
    typeof candidate.visitSessionId ===
      "string" &&
    candidate.visitSessionId.length > 0 &&
    (candidate.sourceCode === null ||
      normalizePilotSourceCode(
        candidate.sourceCode
      ) === candidate.sourceCode) &&
    typeof candidate.startedAt ===
      "number" &&
    Number.isFinite(candidate.startedAt) &&
    typeof candidate.expiresAt ===
      "number" &&
    Number.isFinite(candidate.expiresAt) &&
    candidate.expiresAt >
      candidate.startedAt
  );
}
