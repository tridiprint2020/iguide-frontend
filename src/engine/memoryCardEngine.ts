import type {
  Experience,
} from "../types/experience/experience";

import type {
  ExpeditionTrack,
  TimelineItem,
} from "../types/tracking/tracking";

import type {
  MemoryCardData,
} from "../types/memoryCard";

import {
  getJourneyStats,
} from "./trackingEngine";

import {
  getGeoLabel,
} from "./geoLabelEngine";
import { getAppLanguage } from "../i18n";

function getUserNote(
  item: TimelineItem
): string {
  /*
   * Únicamente una memoria puede presentar
   * una nota escrita por el usuario.
   *
   * Inicio, caminata, abandono y llegada
   * se comunican mediante su estado visual,
   * no mediante frases automáticas.
   */
  if (
    item.type !== "memory"
  ) {
    return "";
  }

  return item.note?.trim() ?? "";
}

export const MemoryCardEngine = {
  build(
    experience: Experience,
    track: ExpeditionTrack,
    options?: {
      note?: string;
      photo?: string;
      includePhoto?: boolean;
      lat?: number;
      lng?: number;
    }
  ): MemoryCardData {
    const lat =
      options?.lat ??
      experience.latitude;

    const lng =
      options?.lng ??
      experience.longitude;

    const stats =
      getJourneyStats(
        track.timeline,
        track.startedAt
      );

    const geo =
      getGeoLabel(lat, lng);

    const suppliedNote =
      options?.note?.trim();

    return {
      experienceId:
        experience.experienceId,

      title:
        experience.title,

      city:
        experience.city,

      date:
        new Date().toLocaleDateString(
          getAppLanguage() === "en"
            ? "en-US"
            : "es-PE"
        ),

      photo:
        options?.includePhoto === false
          ? undefined
          : options?.photo ??
            stats.lastPhoto,

      /*
       * No se inventa una nota.
       * Sin texto del usuario, queda vacío.
       */
      note:
        suppliedNote ??
        stats.lastNote ??
        "",

      placeLabel:
        geo.text,

      primaryInterest:
        experience.interests?.[0],

      lat,
      lng,

      waypoints:
        track.timeline,

      stats,

      mapBackground: {
        center: [
          lat,
          lng,
        ],

        path:
          track.timeline
            .filter(
              (point) =>
                point.type !==
                "memory"
            )
            .map(
              (point) =>
                [
                  point.lat,
                  point.lng,
                ] as [
                  number,
                  number,
                ]
            ),

        memories:
          track.timeline.filter(
            (point) =>
              point.type ===
              "memory"
          ),
      },
    };
  },

  buildFromTimelineItem(
    experience: Experience,
    track: ExpeditionTrack,
    item: TimelineItem
  ): MemoryCardData {
    const timelineUntilItem =
      track.timeline.filter(
        (timelineItem) =>
          timelineItem.timestamp <=
          item.timestamp
      );

    const stats =
      getJourneyStats(
        timelineUntilItem,
        track.startedAt
      );

    const geo =
      getGeoLabel(
        item.lat,
        item.lng
      );

    return {
      experienceId:
        experience.experienceId,

      title:
        experience.title,

      city:
        experience.city,

      date:
        new Date(
          item.timestamp
        ).toLocaleDateString(
          getAppLanguage() === "en"
            ? "en-US"
            : "es-PE"
        ),

      photo:
        item.type === "memory"
          ? item.photo
          : undefined,

      /*
       * Solamente aparece una frase si fue
       * escrita realmente en una memoria.
       */
      note:
        getUserNote(item),

      placeLabel:
        geo.text,

      primaryInterest:
        experience.interests?.[0],

      lat:
        item.lat,

      lng:
        item.lng,

      center: [
        item.lat,
        item.lng,
      ],

      path:
        timelineUntilItem
          .filter(
            (timelineItem) =>
              timelineItem.type !==
              "memory"
          )
          .map(
            (timelineItem) =>
              [
                timelineItem.lat,
                timelineItem.lng,
              ] as [
                number,
                number,
              ]
          ),

      waypoints:
        timelineUntilItem,

      stats,

      mapBackground: {
        center: [
          item.lat,
          item.lng,
        ],

        path:
          timelineUntilItem
            .filter(
              (timelineItem) =>
                timelineItem.type !==
                "memory"
            )
            .map(
              (timelineItem) =>
                [
                  timelineItem.lat,
                  timelineItem.lng,
                ] as [
                  number,
                  number,
                ]
            ),

        memories:
          timelineUntilItem.filter(
            (timelineItem) =>
              timelineItem.type ===
              "memory"
          ),
      },
    };
  },
};
