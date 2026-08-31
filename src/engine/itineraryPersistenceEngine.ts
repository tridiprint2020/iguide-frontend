import {
  catalog,
} from "../data/catalog";
import type {
  Experience,
} from "../types/experience";
import type {
  ItineraryPlan,
  ItineraryPlanPreferences,
  NormalizedItineraryPlanSnapshot,
  SavedItineraryPlan,
} from "../types/itinerary";
import {
  migrateItinerarySnapshot,
} from "./itinerarySnapshotMigrationEngine";

const STORAGE_KEY =
  "iguide.saved-itineraries.v1";

const MAX_SAVED_PLANS = 20;

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function parseItinerarySnapshot(
  value: unknown
): NormalizedItineraryPlanSnapshot | null {
  return migrateItinerarySnapshot(value);
}

export function createItinerarySnapshot(
  plan: ItineraryPlan,
  preferences: ItineraryPlanPreferences
): NormalizedItineraryPlanSnapshot {
  return {
    schemaVersion: 2,
    selectedDate:
      plan.selectedDate,
    selectedHour:
      plan.selectedHour,
    endMinutes:
      plan.endMinutes,
    availableMinutes:
      plan.availableMinutes,
    totalDurationMinutes:
      plan.totalDurationMinutes,
    preferences: {
      ...preferences,
    },
    forecast: plan.forecast
      ? { ...plan.forecast }
      : null,
    selectedForecastPeriod:
      plan.selectedForecastPeriod
        ? { ...plan.selectedForecastPeriod }
        : null,
    stops: plan.stops.map((stop) => ({
      experienceId:
        stop.experience.experienceId,
      startMinutes:
        stop.startMinutes,
      endMinutes:
        stop.endMinutes,
      travelMinutes:
        stop.travelMinutes,
      visitMinutes:
        stop.visitMinutes,
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
    })),
    exclusions: plan.exclusions.map(
      (exclusion) => ({
        ...exclusion,
        explanation: {
          ...exclusion.explanation,
          ...(exclusion.explanation.params
            ? {
                params: {
                  ...exclusion.explanation.params,
                },
              }
            : {}),
        },
      })
    ),
  };
}

export type ItineraryHydrationResult = {
  plan: ItineraryPlan | null;
  omittedStopCount: number;
};

export function hydrateItinerarySnapshotWithReport(
  snapshot: NormalizedItineraryPlanSnapshot,
  experiences: Experience[] = catalog
): ItineraryHydrationResult {
  const experienceById = new Map(
    experiences
      .filter(
        (experience) =>
          experience.isActive
      )
      .map((experience) => [
        experience.experienceId,
        experience,
      ])
  );

  const stops = snapshot.stops
    .map((stop) => {
      const experience =
        experienceById.get(
          stop.experienceId
        );

      return experience
        ? {
            experience,
            startMinutes:
              stop.startMinutes,
            endMinutes:
              stop.endMinutes,
            travelMinutes:
              stop.travelMinutes,
            visitMinutes:
              stop.visitMinutes,
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
          }
        : null;
    })
    .filter(
      (
        stop
      ): stop is NonNullable<
        typeof stop
      > => stop !== null
    );

  const omittedStopCount =
    snapshot.stops.length -
    stops.length;

  if (
    snapshot.stops.length > 0 &&
    stops.length === 0
  ) {
    return {
      plan: null,
      omittedStopCount,
    };
  }

  return {
    plan: {
      selectedDate:
        snapshot.selectedDate,
      selectedHour:
        snapshot.selectedHour,
      endMinutes:
        snapshot.endMinutes,
      availableMinutes:
        snapshot.availableMinutes,
      totalDurationMinutes:
        snapshot.totalDurationMinutes,
      forecast: snapshot.forecast
        ? { ...snapshot.forecast }
        : null,
      selectedForecastPeriod:
        snapshot.selectedForecastPeriod
          ? {
              ...snapshot.selectedForecastPeriod,
            }
          : null,
      stops,
      exclusions:
        snapshot.exclusions.map(
          (exclusion) => ({
            ...exclusion,
            explanation: {
              ...exclusion.explanation,
              ...(exclusion.explanation.params
                ? {
                    params: {
                      ...exclusion.explanation.params,
                    },
                  }
                : {}),
            },
          })
        ),
    },
    omittedStopCount,
  };
}

/**
 * Contrato compatible para consumidores que solo necesitan el plan.
 * La UI usa la variante con reporte cuando debe explicar omisiones.
 */
export function hydrateItinerarySnapshot(
  snapshot: NormalizedItineraryPlanSnapshot,
  experiences: Experience[] = catalog
): ItineraryPlan | null {
  return hydrateItinerarySnapshotWithReport(
    snapshot,
    experiences
  ).plan;
}

function getSnapshotIdentity(
  snapshot: NormalizedItineraryPlanSnapshot
): string {
  return [
    snapshot.selectedDate,
    snapshot.selectedHour,
    ...snapshot.stops.map(
      (stop) => stop.experienceId
    ),
  ].join("::");
}

function parseSavedPlan(
  value: unknown
): SavedItineraryPlan | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isFiniteNumber(value.savedAt)
  ) {
    return null;
  }

  const snapshot =
    parseItinerarySnapshot(
      value.snapshot
    );

  return snapshot
    ? {
        id: value.id,
        savedAt:
          value.savedAt,
        snapshot,
      }
    : null;
}

export function loadSavedItineraries(): SavedItineraryPlan[] {
  try {
    const raw = localStorage.getItem(
      STORAGE_KEY
    );

    if (!raw) return [];

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(parseSavedPlan)
      .filter(
        (
          plan
        ): plan is SavedItineraryPlan =>
          plan !== null
      )
      .sort(
        (a, b) =>
          b.savedAt - a.savedAt
      )
      .slice(0, MAX_SAVED_PLANS);
  } catch {
    return [];
  }
}

export function saveItineraryPlan(
  plan: ItineraryPlan,
  preferences: ItineraryPlanPreferences
): SavedItineraryPlan {
  const snapshot =
    createItinerarySnapshot(
      plan,
      preferences
    );
  const identity =
    getSnapshotIdentity(snapshot);
  const savedAt = Date.now();
  const existing =
    loadSavedItineraries();
  const samePlan = existing.find(
    (item) =>
      getSnapshotIdentity(
        item.snapshot
      ) === identity
  );
  const savedPlan: SavedItineraryPlan = {
    id:
      samePlan?.id ??
      `plan-${savedAt.toString(36)}`,
    savedAt,
    snapshot,
  };
  const next = [
    savedPlan,
    ...existing.filter(
      (item) =>
        item.id !== savedPlan.id
    ),
  ].slice(0, MAX_SAVED_PLANS);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(next)
  );

  const verifiedPlan = loadSavedItineraries().find(
    (item) => item.id === savedPlan.id
  );

  if (
    !verifiedPlan ||
    getSnapshotIdentity(
      verifiedPlan.snapshot
    ) !== identity
  ) {
    throw new Error(
      "Unable to verify saved itinerary."
    );
  }

  return verifiedPlan;
}

export function deleteSavedItinerary(
  id: string
): SavedItineraryPlan[] {
  const next = loadSavedItineraries()
    .filter((item) => item.id !== id);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(next)
  );

  return next;
}
