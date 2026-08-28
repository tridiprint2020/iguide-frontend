import {
  createPilotAttribution,
  isPilotAttribution,
  isPilotAttributionActive,
  normalizePilotSourceCode,
  shouldReuseQrAttribution,
  type PilotAttribution,
} from "../engine/pilotAttributionEngine";

const PILOT_ATTRIBUTION_STORAGE_KEY =
  "iguide_pilot_attribution_v1";

function readStoredAttribution():
  | PilotAttribution
  | null {
  try {
    const rawValue = window.localStorage.getItem(
      PILOT_ATTRIBUTION_STORAGE_KEY
    );

    if (!rawValue) {
      return null;
    }

    const parsed: unknown =
      JSON.parse(rawValue);

    if (!isPilotAttribution(parsed)) {
      window.localStorage.removeItem(
        PILOT_ATTRIBUTION_STORAGE_KEY
      );
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeAttribution(
  attribution: PilotAttribution
): void {
  try {
    window.localStorage.setItem(
      PILOT_ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution)
    );
  } catch {
    // La navegación nunca debe fallar por almacenamiento bloqueado.
  }
}

export function getCurrentPilotAttribution(
  now = Date.now()
): PilotAttribution | null {
  const attribution =
    readStoredAttribution();

  if (
    !attribution ||
    !isPilotAttributionActive(
      attribution,
      now
    )
  ) {
    return null;
  }

  return attribution;
}

export function getOrCreatePilotAttribution(
  now = Date.now()
): PilotAttribution {
  const current =
    getCurrentPilotAttribution(now);

  if (current) {
    return current;
  }

  const attribution =
    createPilotAttribution(
      null,
      now,
      crypto.randomUUID()
    );

  writeAttribution(attribution);
  return attribution;
}

export function beginPilotQrAttribution(
  rawSourceCode: string | null | undefined,
  now = Date.now()
): PilotAttribution | null {
  const sourceCode =
    normalizePilotSourceCode(
      rawSourceCode
    );

  if (!sourceCode) {
    return null;
  }

  const current =
    readStoredAttribution();

  if (
    shouldReuseQrAttribution(
      current,
      sourceCode,
      now
    )
  ) {
    return current;
  }

  const attribution =
    createPilotAttribution(
      sourceCode,
      now,
      crypto.randomUUID()
    );

  writeAttribution(attribution);
  return attribution;
}
