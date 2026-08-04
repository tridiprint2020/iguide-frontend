import type { Experience } from "../types/experience/experience";
import type {
  ExpeditionTrack,
  TimelineItem,
} from "../types/tracking/tracking";
import type { MemoryCardData } from "../types/memoryCard";
import { getJourneyStats } from "./trackingEngine";
import { getGeoLabel } from "./geoLabelEngine";

function getTimelineItemNote(
  item: TimelineItem,
  experience: Experience
): string {
  switch (item.type) {
    case "start":
      return `Comencé mi aventura hacia ${experience.title}. Cada gran recorrido empieza con un primer paso.`;

    case "memory":
      return (
        item.note ||
        `Guardé un recuerdo durante mi experiencia en ${experience.title}.`
      );

    case "abort":
      return `Hasta aquí llegó esta parte de la aventura. El recorrido quedó guardado para continuar descubriendo la ciudad.`;

    case "finish":
      return `Llegué a ${experience.title} y completé esta experiencia con I.GUIDE.`;

    case "walk":
      return `Este punto forma parte de mi recorrido hacia ${experience.title}.`;

    default:
      return "Un momento registrado durante mi recorrido con I.GUIDE.";
  }
}

export const MemoryCardEngine = {
  /**
   * Construye la tarjeta general del recorrido.
   */
  build(
    experience: Experience,
    track: ExpeditionTrack,
    options?: {
      note?: string;
      photo?: string;
      lat?: number;
      lng?: number;
    }
  ): MemoryCardData {
    const lat =
      options?.lat ?? experience.latitude;

    const lng =
      options?.lng ?? experience.longitude;

    const stats = getJourneyStats(
      track.timeline,
      track.startedAt
    );

    const geo = getGeoLabel(lat, lng);

    return {
      title: experience.title,
      city: experience.city,
      date: new Date().toLocaleDateString(
        "es-PE"
      ),
      photo:
        options?.photo ?? stats.lastPhoto,
      note:
        options?.note ?? stats.lastNote,
      placeLabel: geo.text,
      primaryInterest:
        experience.interests?.[0],
      lat,
      lng,
      waypoints: track.timeline,
      stats,
      mapBackground: {
        center: [lat, lng],
        path: track.timeline.map(
          (point) =>
            [point.lat, point.lng] as [
              number,
              number,
            ]
        ),
        memories: track.timeline.filter(
          (point) => point.type === "memory"
        ),
      },
    };
  },

  /**
   * Construye una Memory Card para un hito concreto
   * del Timeline: inicio, recuerdo, abandono o llegada.
   */
  buildFromTimelineItem(
    experience: Experience,
    track: ExpeditionTrack,
    item: TimelineItem
  ): MemoryCardData {
    /*
     * La tarjeta de un hito solo muestra el recorrido
     * ocurrido hasta ese momento. No revela puntos futuros.
     */
    const timelineUntilItem =
      track.timeline.filter(
        (timelineItem) =>
          timelineItem.timestamp <=
          item.timestamp
      );

    const stats = getJourneyStats(
      timelineUntilItem,
      track.startedAt
    );

    const geo = getGeoLabel(
      item.lat,
      item.lng
    );

    return {
      title: experience.title,
      city: experience.city,
      date: new Date(
        item.timestamp
      ).toLocaleDateString("es-PE"),
      photo:
        item.photo ?? stats.lastPhoto,
      note: getTimelineItemNote(
        item,
        experience
      ),
      placeLabel: geo.text,
      primaryInterest:
        experience.interests?.[0],
      lat: item.lat,
      lng: item.lng,
      center: [item.lat, item.lng],
      path: timelineUntilItem
        .filter(
          (timelineItem) =>
            timelineItem.type !== "memory"
        )
        .map(
          (timelineItem) =>
            [
              timelineItem.lat,
              timelineItem.lng,
            ] as [number, number]
        ),
      waypoints: timelineUntilItem,
      stats,
      mapBackground: {
        center: [item.lat, item.lng],
        path: timelineUntilItem
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
              ] as [number, number]
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