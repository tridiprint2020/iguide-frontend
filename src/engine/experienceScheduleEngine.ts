import { tx } from "../i18n";
import type {
  AnnualDateBoundary,
  AnnualFestivalSchedule,
  Experience,
  Weekday,
  WeeklyOpeningSchedule,
} from "../types/experience";

export type ExperienceOpeningWindow = {
  hasSchedule: boolean;
  isScheduledToday: boolean;
  opensAt: number;
  closesAt: number;
};

export type ExperienceOpeningStatus = {
  hasSchedule: boolean;
  isScheduledToday: boolean;
  isOpen: boolean;
  opensAt?: string;
  closesAt?: string;
};

export type ScheduleReadiness =
  | "ready"
  | "variable"
  | "unverified";

const DAY_LABELS: Record<Weekday, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

function parseClock(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 24 ||
    minutes < 0 ||
    minutes > 59 ||
    (hours === 24 && minutes !== 0)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatClock(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const rest = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function getWeeklySchedule(
  experience: Experience
): WeeklyOpeningSchedule | null {
  if (!("weeklySchedule" in experience)) return null;

  const schedule = experience.weeklySchedule;

  return schedule ?? null;
}

function parseLegacySchedule(
  experience: Experience
): { opensAt: number; closesAt: number } | null {
  if (
    !("openingHours" in experience) ||
    typeof experience.openingHours !== "string"
  ) {
    return null;
  }

  const match = experience.openingHours.match(
    /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/
  );

  if (!match) return null;

  const opensAt = parseClock(`${match[1]}:${match[2]}`);
  const parsedClose = parseClock(`${match[3]}:${match[4]}`);

  if (opensAt === null || parsedClose === null) return null;

  return {
    opensAt,
    closesAt:
      parsedClose <= opensAt
        ? parsedClose + 24 * 60
        : parsedClose,
  };
}

function getAnnualSchedule(
  experience: Experience
): AnnualFestivalSchedule | null {
  if (!("annualSchedule" in experience)) {
    return null;
  }

  return experience.annualSchedule ?? null;
}

function resolveAnnualBoundaryDay(
  boundary: AnnualDateBoundary,
  year: number
): number | null {
  if (
    !Number.isInteger(boundary.month) ||
    boundary.month < 1 ||
    boundary.month > 12
  ) {
    return null;
  }

  const lastDay = new Date(
    year,
    boundary.month,
    0
  ).getDate();
  const day =
    "endOfMonth" in boundary
      ? lastDay
      : boundary.day;

  if (
    !Number.isInteger(day) ||
    day < 1 ||
    day > lastDay
  ) {
    return null;
  }

  return boundary.month * 100 + day;
}

function isAnnualScheduleActive(
  schedule: AnnualFestivalSchedule,
  selectedDate: string
): boolean | null {
  const match = selectedDate.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const start = resolveAnnualBoundaryDay(
    schedule.start,
    year
  );
  const end = resolveAnnualBoundaryDay(
    schedule.end,
    year
  );

  if (start === null || end === null) {
    return null;
  }

  const selected = month * 100 + day;

  return start <= end
    ? selected >= start && selected <= end
    : selected >= start || selected <= end;
}

function getAnnualOpeningWindow(
  schedule: AnnualFestivalSchedule,
  selectedDate: string
): ExperienceOpeningWindow | null {
  const active = isAnnualScheduleActive(
    schedule,
    selectedDate
  );

  if (active === null) return null;

  if (schedule.timing.kind === "variable") {
    return null;
  }

  if (schedule.timing.kind === "all-day") {
    return {
      hasSchedule: true,
      isScheduledToday: active,
      opensAt: 0,
      closesAt: 24 * 60,
    };
  }

  const opensAt = parseClock(
    schedule.timing.opensAt
  );
  const rawClose = parseClock(
    schedule.timing.closesAt
  );

  if (opensAt === null || rawClose === null) {
    return null;
  }

  return {
    hasSchedule: true,
    isScheduledToday: active,
    opensAt,
    closesAt:
      rawClose <= opensAt
        ? rawClose + 24 * 60
        : rawClose,
  };
}

/**
 * Confirma que el motor posee una ventana utilizable antes de recomendar.
 *
 * - Los espacios comerciales necesitan un horario legible.
 * - Festivales y eventos necesitan una fecha estructurada que todavía no
 *   existe en el contrato; un texto como "finales de julio" no basta.
 * - Las expediciones se gobiernan por luz, clima y transporte.
 */
export function getScheduleReadiness(
  experience: Experience
): ScheduleReadiness {
  if (
    experience.type === "festival" ||
    experience.type === "event"
  ) {
    const annual = getAnnualSchedule(experience);

    if (!annual) return "unverified";

    if (
      annual.timing.kind === "variable" ||
      annual.locationScope === "citywide" ||
      annual.locationScope ===
        "route-and-citywide"
    ) {
      return "variable";
    }

    return getAnnualOpeningWindow(
      annual,
      "2028-02-29"
    ) === null
      ? "unverified"
      : "ready";
  }

  if (experience.type === "hotel") {
    return "unverified";
  }

  if (experience.type === "expedition") {
    return "ready";
  }

  const weekly = getWeeklySchedule(experience);

  if (weekly) {
    return weekly.days.length > 0 &&
      parseClock(weekly.opensAt) !== null &&
      parseClock(weekly.closesAt) !== null
      ? "ready"
      : "unverified";
  }

  return parseLegacySchedule(experience)
    ? "ready"
    : "unverified";
}

export function hasRecommendableSchedule(
  experience: Experience
): boolean {
  return getScheduleReadiness(experience) === "ready";
}

function parseSelectedWeekday(selectedDate: string): Weekday | null {
  const match = selectedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.getDay() as Weekday;
}

type WeeklyWindowAtDateTime = {
  hasSchedule: boolean;
  isScheduledToday: boolean;
  isOpen: boolean;
  opensAt: number;
  closesAt: number;
  currentMinutes: number;
};

/**
 * Resuelve turnos que cruzan medianoche según el día en que comenzaron.
 * Así, la madrugada del lunes puede seguir perteneciendo al turno del
 * domingo, pero la madrugada del jueves no abre anticipadamente un local
 * cuyo primer turno recién empieza el jueves por la noche.
 */
function getWeeklyWindowAtDateTime(
  experience: Experience,
  currentDate: Date
): WeeklyWindowAtDateTime | null {
  const weekly = getWeeklySchedule(experience);

  if (!weekly) return null;

  const opensAt = parseClock(weekly.opensAt);
  const rawClose = parseClock(weekly.closesAt);
  const currentMinutes =
    currentDate.getHours() * 60 +
    currentDate.getMinutes();

  if (opensAt === null || rawClose === null) {
    return {
      hasSchedule: false,
      isScheduledToday: true,
      isOpen: true,
      opensAt: 0,
      closesAt: 24 * 60,
      currentMinutes,
    };
  }

  const weekday = currentDate.getDay() as Weekday;
  const previousWeekday = ((weekday + 6) % 7) as Weekday;
  const startsToday = weekly.days.includes(weekday);
  const crossesMidnight = rawClose <= opensAt;

  if (!crossesMidnight) {
    return {
      hasSchedule: true,
      isScheduledToday: startsToday,
      isOpen:
        startsToday &&
        currentMinutes >= opensAt &&
        currentMinutes <= rawClose,
      opensAt,
      closesAt: rawClose,
      currentMinutes,
    };
  }

  const continuesFromYesterday =
    weekly.days.includes(previousWeekday) &&
    currentMinutes <= rawClose;
  const currentShiftStarted =
    startsToday && currentMinutes >= opensAt;

  return {
    hasSchedule: true,
    isScheduledToday:
      startsToday || continuesFromYesterday,
    isOpen:
      continuesFromYesterday ||
      currentShiftStarted,
    opensAt: continuesFromYesterday
      ? opensAt - 24 * 60
      : opensAt,
    closesAt: continuesFromYesterday
      ? rawClose
      : rawClose + 24 * 60,
    currentMinutes,
  };
}

export function getExperienceOpeningWindow(
  experience: Experience,
  selectedDate: string
): ExperienceOpeningWindow {
  const annual = getAnnualSchedule(experience);

  if (annual) {
    const annualWindow =
      getAnnualOpeningWindow(
        annual,
        selectedDate
      );

    if (annualWindow) return annualWindow;
  }

  const weekly = getWeeklySchedule(experience);

  if (weekly) {
    const opensAt = parseClock(weekly.opensAt);
    const rawClose = parseClock(weekly.closesAt);
    const weekday = parseSelectedWeekday(selectedDate);

    if (opensAt === null || rawClose === null || weekday === null) {
      return {
        hasSchedule: false,
        isScheduledToday: true,
        opensAt: 0,
        closesAt: 24 * 60,
      };
    }

    return {
      hasSchedule: true,
      isScheduledToday: weekly.days.includes(weekday),
      opensAt,
      closesAt: rawClose <= opensAt ? rawClose + 24 * 60 : rawClose,
    };
  }

  const legacy = parseLegacySchedule(experience);

  if (!legacy) {
    return {
      hasSchedule: false,
      isScheduledToday: true,
      opensAt: 0,
      closesAt: 24 * 60,
    };
  }

  return {
    hasSchedule: true,
    isScheduledToday: true,
    ...legacy,
  };
}

export function getExperienceOpeningStatus(
  experience: Experience | null | undefined,
  currentDate: Date
): ExperienceOpeningStatus {
  if (!experience) {
    return {
      hasSchedule: false,
      isScheduledToday: true,
      isOpen: true,
    };
  }

  const weeklyWindow = getWeeklyWindowAtDateTime(
    experience,
    currentDate
  );

  if (weeklyWindow) {
    return {
      hasSchedule: weeklyWindow.hasSchedule,
      isScheduledToday:
        weeklyWindow.isScheduledToday,
      isOpen: weeklyWindow.isOpen,
      ...(weeklyWindow.hasSchedule
        ? {
            opensAt: formatClock(
              weeklyWindow.opensAt
            ),
            closesAt: formatClock(
              weeklyWindow.closesAt
            ),
          }
        : {}),
    };
  }

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const window = getExperienceOpeningWindow(
    experience,
    `${year}-${month}-${day}`
  );
  const currentMinutes =
    currentDate.getHours() * 60 + currentDate.getMinutes();
  const overnightMinutes =
    window.closesAt > 24 * 60 && currentMinutes < window.opensAt
      ? currentMinutes + 24 * 60
      : currentMinutes;

  return {
    hasSchedule: window.hasSchedule,
    isScheduledToday: window.isScheduledToday,
    isOpen:
      !window.hasSchedule ||
      (window.isScheduledToday &&
        overnightMinutes >= window.opensAt &&
        overnightMinutes <= window.closesAt),
    ...(window.hasSchedule
      ? {
          opensAt: formatClock(window.opensAt),
          closesAt: formatClock(window.closesAt),
        }
      : {}),
  };
}

/**
 * Evita sugerir "ir ahora" cuando el local cerrará antes de completar
 * una visita normal. El itinerario futuro conserva su cálculo detallado.
 */
export function canCompleteVisitNow(
  experience: Experience,
  currentDate: Date
): boolean {
  if (!hasRecommendableSchedule(experience)) {
    return false;
  }

  const weeklyWindow = getWeeklyWindowAtDateTime(
    experience,
    currentDate
  );
  const visitMinutes = Math.max(
    30,
    experience.estimatedVisitMinutes ?? 60
  );

  if (weeklyWindow) {
    return (
      weeklyWindow.hasSchedule &&
      weeklyWindow.isOpen &&
      weeklyWindow.currentMinutes +
        visitMinutes <=
        weeklyWindow.closesAt
    );
  }

  const year = currentDate.getFullYear();
  const month = String(
    currentDate.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    currentDate.getDate()
  ).padStart(2, "0");
  const window = getExperienceOpeningWindow(
    experience,
    `${year}-${month}-${day}`
  );

  if (!window.hasSchedule) {
    return true;
  }

  if (!window.isScheduledToday) {
    return false;
  }

  const currentMinutes =
    currentDate.getHours() * 60 +
    currentDate.getMinutes();
  const normalizedCurrent =
    window.closesAt > 24 * 60 &&
    currentMinutes < window.opensAt
      ? currentMinutes + 24 * 60
      : currentMinutes;
  return (
    normalizedCurrent >= window.opensAt &&
    normalizedCurrent + visitMinutes <=
      window.closesAt
  );
}

function getDayRangeLabel(days: readonly Weekday[]): string {
  const unique = [...new Set(days)].sort((a, b) => a - b);

  if (unique.length === 7) return tx("Todos los días");
  if (unique.join(",") === "1,2,3,4,5,6") return tx("Lun–Sáb");
  if (unique.join(",") === "0,6") return tx("Sáb–Dom");

  return unique.map((day) => tx(DAY_LABELS[day])).join(", ");
}

export function getExperienceScheduleLabel(
  experience: Experience
): string | null {
  const weekly = getWeeklySchedule(experience);

  if (weekly) {
    const parts = [
      getDayRangeLabel(weekly.days),
      `${weekly.opensAt}–${weekly.closesAt}`,
    ];

    if (weekly.closedOnHolidays) {
      parts.push(tx("feriados cerrado"));
    }

    if (weekly.closesWhenSoldOut) {
      parts.push(tx("hasta agotar existencias"));
    }

    return parts.join(" · ");
  }

  const legacy = parseLegacySchedule(experience);

  return legacy
    ? `${formatClock(legacy.opensAt)}–${formatClock(legacy.closesAt)}`
    : null;
}
