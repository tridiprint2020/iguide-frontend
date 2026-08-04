import type { Interest } from "./interest";
import type { JourneyStats } from "../engine/trackingEngine";
import type { TimelineItem } from "./tracking/tracking";

export interface MemoryCardData {
  title: string;
  placeLabel: string;
  city: string;
  date: string;

  photo?: string;
  note?: string;

  lat?: number;
  lng?: number;

  center?: [number, number];
  path?: [number, number][];

  waypoints?: TimelineItem[];

  primaryInterest?: Interest;

  stats: JourneyStats;

  mapBackground?: {
    center: [number, number];
    path: [number, number][];
    memories: TimelineItem[];
  };
}