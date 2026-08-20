import type {
  Experience,
} from "./experience";

export type ItineraryDuration = "today" | "2days" | "3days" | "week";
export type ItineraryCompanions = "solo" | "couple" | "friends" | "family";
export type ItineraryBudget = "budget" | "mid" | "premium";
export type ItineraryPace = "low" | "medium" | "high";
export type ItineraryTime = "morning" | "afternoon" | "night";
export type ItineraryTransport = "walking" | "transport" | "taxi";

export type ItineraryDecisionAction =
  | "recommended"
  | "excluded"
  | "replaced";

export type ItineraryReasonCode =
  | "interest-match"
  | "weather-compatible"
  | "indoor-priority"
  | "weather-unknown-conservative"
  | "full-day-experience"
  | "weather-wet-risk"
  | "weather-unknown-risk"
  | "high-mountain-weather"
  | "night-incompatible"
  | "transport-incompatible"
  | "outside-opening-hours"
  | "full-day-conflict"
  | "not-enough-time";

export type ItineraryReasonParams = Record<
  string,
  string | number | boolean
>;

export interface ItineraryDecision {
  action: ItineraryDecisionAction;
  reasonCode: ItineraryReasonCode;
  params?: ItineraryReasonParams;
}

export interface ItineraryStop {
  experience: Experience;
  startMinutes: number;
  endMinutes: number;
  travelMinutes: number;
  visitMinutes: number;
  explanation: ItineraryDecision;
}

export interface ItineraryExclusion {
  experienceId: string;
  title: string;
  explanation: ItineraryDecision;
}

export interface ItineraryWeatherSnapshot {
  date: string;
  city: string;
  condition:
    | "sunny"
    | "cloudy"
    | "drizzle"
    | "rain"
    | "snow";
  temperatureMin: number;
  temperatureMax: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  isHighMountainSafe: boolean;
}

export interface ItineraryPlan {
  selectedDate: string;
  selectedHour: number;
  availableMinutes: number;
  totalDurationMinutes: number;
  forecast: ItineraryWeatherSnapshot | null;
  stops: ItineraryStop[];
  exclusions: ItineraryExclusion[];
}

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
