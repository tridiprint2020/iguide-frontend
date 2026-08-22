import type {
  Experience,
} from "../types/experience";

export type PlaceMarkerState =
  | "catalog"
  | "visited"
  | "mission"
  | "start"
  | "memory"
  | "finish"
  | "home"
  | "abort";

export type PlaceMarkerVisual = {
  color: string;
  haloColor: string;
  symbolColor: string;
  pulses: boolean;
  bounces: boolean;
};

export const PLACE_MARKER_COLORS = {
  magenta: "#FF00FF",
  cyan: "#00E6FF",
  orange: "#FF8A00",
} as const;

const VISUALS: Record<
  PlaceMarkerState,
  PlaceMarkerVisual
> = {
  catalog: {
    color: PLACE_MARKER_COLORS.magenta,
    haloColor: PLACE_MARKER_COLORS.cyan,
    symbolColor: PLACE_MARKER_COLORS.magenta,
    pulses: false,
    bounces: false,
  },
  visited: {
    color: PLACE_MARKER_COLORS.magenta,
    haloColor: PLACE_MARKER_COLORS.magenta,
    symbolColor: PLACE_MARKER_COLORS.cyan,
    pulses: false,
    bounces: false,
  },
  mission: {
    color: PLACE_MARKER_COLORS.magenta,
    haloColor: PLACE_MARKER_COLORS.cyan,
    symbolColor: PLACE_MARKER_COLORS.magenta,
    pulses: true,
    bounces: true,
  },
  start: {
    color: PLACE_MARKER_COLORS.magenta,
    haloColor: PLACE_MARKER_COLORS.magenta,
    symbolColor: PLACE_MARKER_COLORS.magenta,
    pulses: true,
    bounces: false,
  },
  memory: {
    color: PLACE_MARKER_COLORS.cyan,
    haloColor: PLACE_MARKER_COLORS.cyan,
    symbolColor: PLACE_MARKER_COLORS.cyan,
    pulses: false,
    bounces: false,
  },
  finish: {
    color: PLACE_MARKER_COLORS.magenta,
    haloColor: PLACE_MARKER_COLORS.magenta,
    symbolColor: PLACE_MARKER_COLORS.magenta,
    pulses: true,
    bounces: false,
  },
  home: {
    color: PLACE_MARKER_COLORS.cyan,
    haloColor: PLACE_MARKER_COLORS.cyan,
    symbolColor: PLACE_MARKER_COLORS.cyan,
    pulses: false,
    bounces: false,
  },
  abort: {
    color: PLACE_MARKER_COLORS.orange,
    haloColor: PLACE_MARKER_COLORS.orange,
    symbolColor: PLACE_MARKER_COLORS.orange,
    pulses: false,
    bounces: false,
  },
};

export function getPlaceMarkerVisual(
  state: PlaceMarkerState
): PlaceMarkerVisual {
  return VISUALS[state];
}

export function getExperienceMarkerState(
  experience: Experience,
  context: {
    activeMissionId?: string | null;
    visitedExperienceIds?: ReadonlySet<string>;
  }
): PlaceMarkerState {
  if (
    context.activeMissionId ===
    experience.experienceId
  ) {
    return "mission";
  }

  if (
    context.visitedExperienceIds?.has(
      experience.experienceId
    )
  ) {
    return "visited";
  }

  return "catalog";
}

/**
 * El centro del pin conserva la estrella I.GUIDE. Hoteles usan H para
 * distinguirse a distancia sin cambiar la semántica cromática.
 */
export function getExperienceMarkerSymbol(
  experience: Experience
): string {
  const category =
    experience.placeCategory ??
    experience.type;

  return category === "hotel"
    ? "H"
    : "✦";
}
