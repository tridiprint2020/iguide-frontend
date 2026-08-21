import {
  getAppLanguage,
  tx,
} from "../i18n";
import type {
  ItineraryPlanSnapshot,
} from "../types/itinerary";
import {
  hydrateItinerarySnapshot,
  parseItinerarySnapshot,
} from "./itineraryPersistenceEngine";

const SHARE_QUERY_KEY = "plan";
const MAX_SHARE_PAYLOAD_LENGTH = 12_000;
const CALENDAR_TIMEZONE =
  "America/Lima";

export type SharedItineraryReadResult =
  | {
      status: "absent";
    }
  | {
      status: "invalid";
    }
  | {
      status: "ready";
      snapshot: ItineraryPlanSnapshot;
    };

export type ItineraryShareResult =
  | "shared"
  | "copied"
  | "cancelled";

function getPortableSnapshot(
  snapshot: ItineraryPlanSnapshot
): ItineraryPlanSnapshot {
  return {
    ...snapshot,
    preferences: {
      ...snapshot.preferences,
    },
    forecast: snapshot.forecast
      ? { ...snapshot.forecast }
      : null,
    stops: snapshot.stops.map(
      (stop) => ({
        ...stop,
        explanation: {
          ...stop.explanation,
          ...(stop.explanation.params
            ? {
                params: {
                  ...stop.explanation.params,
                },
              }
            : {}),
        },
      })
    ),

    /*
     * Un enlace compartido necesita reproducir el recorrido, no
     * transportar todo el catálogo descartado. Esto mantiene la URL
     * pequeña y evita publicar información editorial innecesaria.
     */
    exclusions: [],
  };
}

function encodeBase64Url(
  value: string
): string {
  const bytes = new TextEncoder()
    .encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(
  value: string
): string {
  if (
    value.length === 0 ||
    value.length > MAX_SHARE_PAYLOAD_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new Error(
      "Invalid itinerary payload."
    );
  }

  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(
      Math.ceil(value.length / 4) * 4,
      "="
    );
  const binary = atob(normalized);
  const bytes = Uint8Array.from(
    binary,
    (character) =>
      character.charCodeAt(0)
  );

  return new TextDecoder().decode(bytes);
}

export function encodeItinerarySnapshot(
  snapshot: ItineraryPlanSnapshot
): string {
  const encoded = encodeBase64Url(
    JSON.stringify(
      getPortableSnapshot(snapshot)
    )
  );

  if (
    encoded.length >
    MAX_SHARE_PAYLOAD_LENGTH
  ) {
    throw new Error(
      "Itinerary share link is too long."
    );
  }

  return encoded;
}

export function decodeItinerarySnapshot(
  encoded: string
): ItineraryPlanSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(
      decodeBase64Url(encoded)
    );

    return parseItinerarySnapshot(
      parsed
    );
  } catch {
    return null;
  }
}

export function buildItineraryShareUrl(
  snapshot: ItineraryPlanSnapshot,
  origin = window.location.origin
): string {
  const url = new URL(
    "/itinerario",
    origin
  );

  url.searchParams.set(
    SHARE_QUERY_KEY,
    encodeItinerarySnapshot(snapshot)
  );

  return url.toString();
}

export function readSharedItinerary(
  urlValue = window.location.href
): SharedItineraryReadResult {
  try {
    const url = new URL(urlValue);
    const encoded =
      url.searchParams.get(
        SHARE_QUERY_KEY
      );

    if (!encoded) {
      return {
        status: "absent",
      };
    }

    const snapshot =
      decodeItinerarySnapshot(
        encoded
      );

    return snapshot
      ? {
          status: "ready",
          snapshot,
        }
      : {
          status: "invalid",
        };
  } catch {
    return {
      status: "invalid",
    };
  }
}

function formatPlanDate(
  date: string
): string {
  const [year, month, day] =
    date.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12
  ).toLocaleDateString(
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );
}

function formatMinutes(
  totalMinutes: number
): string {
  const hour = Math.floor(
    totalMinutes / 60
  );
  const minute = totalMinutes % 60;

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(minute).padStart(2, "0")}`;
}

function getShareText(
  snapshot: ItineraryPlanSnapshot
): string {
  const plan =
    hydrateItinerarySnapshot(snapshot);
  const stopTitles =
    plan?.stops.map(
      (stop, index) =>
        `${index + 1}. ${formatMinutes(
          stop.startMinutes
        )} · ${stop.experience.title}`
    ) ?? [];

  return [
    tx(
      "Mi itinerario I.GUIDE para {{date}}.",
      {
        date: formatPlanDate(
          snapshot.selectedDate
        ),
      }
    ),
    ...stopTitles,
    tx(
      "Abre el enlace para ver el plan completo y el pronóstico usado."
    ),
  ].join("\n");
}

async function copyText(
  value: string
): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(
      value
    );
    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute(
    "readonly",
    ""
  );
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand(
    "copy"
  );

  textarea.remove();

  if (!copied) {
    throw new Error(
      "Clipboard unavailable."
    );
  }
}

export async function shareItinerary(
  snapshot: ItineraryPlanSnapshot,
  origin = window.location.origin
): Promise<ItineraryShareResult> {
  const url = buildItineraryShareUrl(
    snapshot,
    origin
  );
  const shareData: ShareData = {
    title: tx("Mi itinerario I.GUIDE"),
    text: getShareText(snapshot),
    url,
  };

  if (!navigator.share) {
    await copyText(
      `${shareData.text}\n\n${url}`
    );
    return "copied";
  }

  try {
    await navigator.share(shareData);
    return "shared";
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return "cancelled";
    }

    throw error;
  }
}

function escapeIcsText(
  value: string
): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function getIcsDateTime(
  date: string,
  totalMinutes: number
): string {
  return `${date.replace(/-/g, "")}T${String(
    Math.floor(totalMinutes / 60)
  ).padStart(2, "0")}${String(
    totalMinutes % 60
  ).padStart(2, "0")}00`;
}

function getUtcTimestamp(
  date: Date
): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function foldIcsLine(
  line: string
): string[] {
  const parts: string[] = [];
  let current = "";

  for (const character of line) {
    const candidate =
      current + character;
    const byteLength =
      new TextEncoder().encode(
        candidate
      ).length;

    if (byteLength > 73) {
      parts.push(current);
      current = ` ${character}`;
    } else {
      current = candidate;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

export function buildItineraryCalendar(
  snapshot: ItineraryPlanSnapshot,
  options: {
    generatedAt?: Date;
    shareUrl?: string;
  } = {}
): string {
  const plan =
    hydrateItinerarySnapshot(snapshot);

  if (!plan || plan.stops.length === 0) {
    throw new Error(
      "The itinerary has no calendar stops."
    );
  }

  const firstStop = plan.stops[0];
  const lastStop =
    plan.stops[
      plan.stops.length - 1
    ];
  const generatedAt =
    options.generatedAt ?? new Date();
  const description = [
    ...plan.stops.map(
      (stop, index) =>
        `${index + 1}. ${formatMinutes(
          stop.startMinutes
        )}-${formatMinutes(
          stop.endMinutes
        )} ${stop.experience.title}`
    ),
    plan.forecast
      ? tx(
          "Pronóstico guardado: {{condition}}, {{rain}}% de lluvia.",
          {
            condition:
              plan.forecast.condition,
            rain:
              plan.forecast.precipitationProbability,
          }
        )
      : tx(
          "Plan creado sin pronóstico confirmado."
        ),
  ].join("\n");
  const uidSeed = [
    snapshot.selectedDate,
    snapshot.selectedHour,
    ...snapshot.stops.map(
      (stop) => stop.experienceId
    ),
  ].join("-");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//I.GUIDE//Itinerary v1//ES",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uidSeed)}@iguide`,
    `DTSTAMP:${getUtcTimestamp(generatedAt)}`,
    `DTSTART;TZID=${CALENDAR_TIMEZONE}:${getIcsDateTime(
      snapshot.selectedDate,
      firstStop.startMinutes
    )}`,
    `DTEND;TZID=${CALENDAR_TIMEZONE}:${getIcsDateTime(
      snapshot.selectedDate,
      lastStop.endMinutes
    )}`,
    `SUMMARY:${escapeIcsText(
      tx("I.GUIDE · Plan en Huancayo")
    )}`,
    `DESCRIPTION:${escapeIcsText(
      description
    )}`,
    ...(options.shareUrl
      ? [
          `URL:${escapeIcsText(
            options.shareUrl
          )}`,
        ]
      : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(
      tx(
        "Tu itinerario I.GUIDE comienza en 30 minutos."
      )
    )}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines
    .flatMap(foldIcsLine)
    .join("\r\n")}\r\n`;
}

export function downloadItineraryCalendar(
  snapshot: ItineraryPlanSnapshot,
  origin = window.location.origin
): void {
  const shareUrl = buildItineraryShareUrl(
    snapshot,
    origin
  );
  const calendar =
    buildItineraryCalendar(snapshot, {
      shareUrl,
    });
  const blob = new Blob(
    [calendar],
    {
      type:
        "text/calendar;charset=utf-8",
    }
  );
  const objectUrl =
    URL.createObjectURL(blob);
  const anchor =
    document.createElement("a");

  anchor.href = objectUrl;
  anchor.download =
    `iguide-plan-${snapshot.selectedDate}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(
      objectUrl
    ),
    1500
  );
}
