import type {
  Experience,
} from "./experience";

export type ArCoordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type ArGeoPlacement = {
  experience: Experience;
  distanceMeters: number;
  bearingDegrees: number;
  relativeBearingDegrees: number;
};

export type ArSessionPhase =
  | "idle"
  | "requesting"
  | "locating"
  | "ready"
  | "error";

export type ArSensorSnapshot = {
  phase: ArSessionPhase;
  coordinates: ArCoordinates | null;
  headingDegrees: number | null;
  headingIsAbsolute: boolean;
  cameraStream: MediaStream | null;
  errorMessage: string | null;
};
