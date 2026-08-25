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

export type ArOrientationSample = {
  alphaDegrees: number;
  betaDegrees: number;
  gammaDegrees: number;
  screenOrientationDegrees: number;
};

export type ArQuaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
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
  referenceCoordinates: ArCoordinates | null;
  headingDegrees: number | null;
  referenceHeadingDegrees: number | null;
  headingIsAbsolute: boolean;
  viewQuaternion: ArQuaternion | null;
  calibrationRevision: number;
  cameraStream: MediaStream | null;
  errorMessage: string | null;
};
