export type MealSlot =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner";

type MealWindow = {
  slot: MealSlot;
  startMinutes: number;
  endMinutes: number;
};

const RESTAURANT_WINDOWS: MealWindow[] = [
  {
    slot: "lunch",
    startMinutes: 12 * 60,
    endMinutes: 15 * 60,
  },
  {
    slot: "dinner",
    startMinutes: 18 * 60,
    endMinutes: 21 * 60,
  },
];

const CAFE_WINDOWS: MealWindow[] = [
  {
    slot: "breakfast",
    startMinutes: 7 * 60,
    endMinutes: 11 * 60,
  },
  {
    slot: "snack",
    startMinutes: 15 * 60,
    endMinutes: 18 * 60,
  },
];

const ALL_MEAL_WINDOWS: MealWindow[] = [
  ...CAFE_WINDOWS,
  ...RESTAURANT_WINDOWS,
].sort((a, b) => a.startMinutes - b.startMinutes);

function getFoodWindows(
  experienceType: string
): MealWindow[] {
  if (experienceType === "restaurant") {
    return RESTAURANT_WINDOWS;
  }

  if (experienceType === "cafe") {
    return CAFE_WINDOWS;
  }

  return [];
}

export function getMealSlot(
  experienceType: string,
  minuteOfDay: number
): MealSlot | null {
  return (
    getFoodWindows(experienceType).find(
      (window) =>
        minuteOfDay >= window.startMinutes &&
        minuteOfDay < window.endMinutes
    )?.slot ?? null
  );
}

export function findNextMealWindow(
  experienceType: string,
  earliestMinutes: number,
  usedSlots: ReadonlySet<MealSlot>,
  allowedSlots?: readonly MealSlot[]
): MealWindow | null {
  const windows = allowedSlots
    ? ALL_MEAL_WINDOWS.filter((window) =>
        allowedSlots.includes(window.slot)
      )
    : getFoodWindows(experienceType);

  for (const window of windows) {
    if (
      usedSlots.has(window.slot) ||
      earliestMinutes >= window.endMinutes
    ) {
      continue;
    }

    return {
      ...window,
      startMinutes: Math.max(
        earliestMinutes,
        window.startMinutes
      ),
    };
  }

  return null;
}

function parseClockMinutes(
  isoLocalTime: string
): number | null {
  const match = isoLocalTime.match(
    /T(\d{2}):(\d{2})/
  );

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

export function isOutdoorVisitAfterSunset({
  visitEndMinutes,
  sunset,
  isOutdoorSensitive,
}: {
  visitEndMinutes: number;
  sunset: string | null | undefined;
  isOutdoorSensitive: boolean;
}): boolean {
  if (!isOutdoorSensitive) return false;

  const sunsetMinutes = sunset
    ? parseClockMinutes(sunset)
    : null;
  const limit = sunsetMinutes ?? 18 * 60;

  return visitEndMinutes > limit;
}

export function getWeatherPeriodKey(
  minuteOfDay: number
): "morning" | "afternoon" | "night" {
  if (minuteOfDay < 12 * 60) {
    return "morning";
  }

  if (minuteOfDay < 18 * 60) {
    return "afternoon";
  }

  return "night";
}
