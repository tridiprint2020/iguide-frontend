import { tx } from "../i18n";
import type {
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
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
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

export function getExperienceOpeningWindow(
  experience: Experience,
  selectedDate: string
): ExperienceOpeningWindow {
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
