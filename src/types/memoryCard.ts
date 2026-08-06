import type {
  Interest,
} from "./interest";

import type {
  TimelineItem,
} from "./tracking/tracking";

import type {
  JourneyStats,
} from "../engine/trackingEngine";

/**
 * Datos necesarios para construir, mostrar,
 * compartir y descargar una MemoryCard I.GUIDE.
 */
export interface MemoryCardData {
  /**
   * Permite guardar reacciones y favoritos
   * sobre la experiencia original.
   */
  experienceId?: string;

  title: string;
  placeLabel: string;
  city: string;
  date: string;

  photo?: string;
  note?: string;

  lat?: number;
  lng?: number;

  center?: [
    number,
    number,
  ];

  path?: Array<
    [
      number,
      number,
    ]
  >;

  waypoints?: TimelineItem[];

  primaryInterest?: Interest;

  stats: JourneyStats;

  mapBackground?: {
    center: [
      number,
      number,
    ];

    path: Array<
      [
        number,
        number,
      ]
    >;

    memories: TimelineItem[];
  };
}