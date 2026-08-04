import type { Experience } from "./experience/experience";
import type { TimelineItem } from "./tracking/tracking";

export interface JourneyStats {
  durationSeconds: number;
  totalDistanceKm: number;
  totalMemories: number;
  totalPhotos: number;
  totalNotes: number;
}

export type JourneyState =
  | "IDLE"
  | "WALKING"
  | "CAMERA_OPEN"
  | "POINT_SAVED"
  | "COMPLETED";

export type JourneyScreen =
  | "idle"
  | "walking"
  | "camera"
  | "pointSaved"
  | "completed";

export interface ActiveJourney {
  state: JourneyState;
  screen: JourneyScreen;
  experience: Experience | null;
  startedAt: number | null;
  timeline: TimelineItem[];
}