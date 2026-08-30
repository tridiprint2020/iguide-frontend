import type {
  Experience,
} from "./experience";

export type ItineraryDuration = "today" | "2days" | "3days" | "week";
export type ItineraryCompanions = "solo" | "couple" | "friends" | "family";
export type ItineraryBudget = "budget" | "mid" | "premium";
export type ItineraryPace = "low" | "medium" | "high";
export type ItineraryTime = "morning" | "afternoon" | "night";
export type ItineraryTransport = "walking" | "transport" | "taxi";

export type ItineraryWeatherPeriodKey =
  | "morning"
  | "afternoon"
  | "night";

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
  | "after-sunset-outdoor"
  | "meal-window-unavailable"
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
  apparentTemperature?: number;
  uvIndexMax?: number;
  sunrise?: string;
  sunset?: string;
  daylightDurationSeconds?: number;
  precipitationHours?: number;
  periods?: {
    morning: ItineraryWeatherPeriodSnapshot;
    afternoon: ItineraryWeatherPeriodSnapshot;
    night: ItineraryWeatherPeriodSnapshot;
  };
}

export interface ItineraryWeatherPeriodSnapshot {
  hour: number;
  temperature: number;
  apparentTemperature?: number;
  condition: ItineraryWeatherSnapshot["condition"];
  precipitationProbability?: number;
  windSpeedKmh?: number;
}

export interface ItineraryPlan {
  selectedDate: string;
  selectedHour: number;
  endMinutes: number;
  availableMinutes: number;
  totalDurationMinutes: number;
  forecast: ItineraryWeatherSnapshot | null;
  selectedForecastPeriod: ItineraryWeatherPeriodSnapshot | null;
  stops: ItineraryStop[];
  exclusions: ItineraryExclusion[];
}

export interface ItineraryPlanPreferences {
  priorities: string[];
  transport: ItineraryTransport;
}

export interface ItineraryPlanPreferencesV1 {
  priority: string;
  transport: ItineraryTransport;
}

export interface ItineraryPlanSnapshotStop {
  experienceId: string;
  startMinutes: number;
  endMinutes: number;
  travelMinutes: number;
  visitMinutes: number;
  explanation: ItineraryDecision;
}

/**
 * Contrato portable del itinerario.
 *
 * No guarda perfil, nombre, GPS ni objetos completos del catálogo.
 * Las experiencias se resuelven por ID al restaurar el plan y el
 * pronóstico queda congelado tal como fue usado para recomendarlo.
 */
export interface ItineraryPlanSnapshotV1 {
  schemaVersion: 1;
  selectedDate: string;
  selectedHour: number;
  availableMinutes: number;
  totalDurationMinutes: number;
  preferences: ItineraryPlanPreferencesV1;
  forecast: ItineraryWeatherSnapshot | null;
  stops: ItineraryPlanSnapshotStop[];
  exclusions: ItineraryExclusion[];
}

export interface ItineraryPlanSnapshotV2 {
  schemaVersion: 2;
  selectedDate: string;
  selectedHour: number;
  endMinutes: number;
  availableMinutes: number;
  totalDurationMinutes: number;
  preferences: ItineraryPlanPreferences;
  forecast: ItineraryWeatherSnapshot | null;
  selectedForecastPeriod: ItineraryWeatherPeriodSnapshot | null;
  stops: ItineraryPlanSnapshotStop[];
  exclusions: ItineraryExclusion[];
}

export type ItineraryPlanSnapshot =
  | ItineraryPlanSnapshotV1
  | ItineraryPlanSnapshotV2;

export type NormalizedItineraryPlanSnapshot =
  ItineraryPlanSnapshotV2;

export interface SavedItineraryPlan {
  id: string;
  savedAt: number;
  snapshot: NormalizedItineraryPlanSnapshot;
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
  endMinutes: number; // minuto del día, posterior al inicio

  priorities: string[]; // intereses múltiples, por códigos estables
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
