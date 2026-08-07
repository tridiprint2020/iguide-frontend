export type ItineraryDuration = "today" | "2days" | "3days" | "week";
export type ItineraryCompanions = "solo" | "couple" | "friends" | "family";
export type ItineraryBudget = "budget" | "mid" | "premium";
export type ItineraryPace = "low" | "medium" | "high";
export type ItineraryTime = "morning" | "afternoon" | "night";
export type ItineraryTransport = "walking" | "transport" | "taxi";

/**
 * Reemplaza el viejo flujo de varias preguntas (duration +
 * timeOfDay) por un día y una hora reales elegidos en el
 * calendario de una sola pantalla. itineraryEngine deriva
 * cuántas horas de exploración hay disponibles a partir de
 * estos dos campos, en vez de preguntarlo directamente.
 */
export interface ItineraryAnswers {
  selectedDate: string; // ISO yyyy-mm-dd
  selectedHour: number; // 0-23

  priority: string; // reutiliza tus Interest existentes
  transport: ItineraryTransport;

  /*
   * Opcionales: ya no se preguntan en la pantalla única de
   * Itinerario, pero quedan disponibles por si otro flujo
   * (ej. Hospes conversacional a futuro) los llega a usar.
   */
  companions?: ItineraryCompanions;
  budget?: ItineraryBudget;
  hasCar?: boolean;
  pace?: ItineraryPace;
  duration?: ItineraryDuration;
  timeOfDay?: ItineraryTime;
}