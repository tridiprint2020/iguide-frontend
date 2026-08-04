import type { UserProfile } from "./user/user";
import type { ItineraryAnswers } from "./itinerary";

export interface ExplorerContext {
  /**
   * Perfil permanente del explorador.
   */
  profile: UserProfile;

  /**
   * Respuestas temporales del planificador (Hospes).
   */
  answers?: ItineraryAnswers;

  /**
   * Ciudad activa.
   * Permitirá soportar múltiples ciudades en el futuro.
   */
  cityId?: string;

  /**
   * Idioma del explorador.
   */
  language?: string;

  /**
   * Coordenadas GPS actuales.
   */
  location?: {
    latitude: number;
    longitude: number;
  };
}