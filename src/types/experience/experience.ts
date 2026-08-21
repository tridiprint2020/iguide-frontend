import type { Difficulty } from "../difficulty";
import type { Interest } from "../interest"; // 🏛️ Importación del tipo base de intereses de la aplicación

export type ExperienceType =

  | "expedition" | "restaurant" | "cafe" | "bar" | "nightclub"
  | "hotel" | "museum" | "festival" | "craft" | "event";

export type PlaceCategory =
  | ExperienceType
  | "icecream_shop"
  | "art_experience";

export type ListingStatus =
  | "editorial"
  | "pilot_partner"
  | "sponsored"
  | "access_point";

export type VenueSubtype =

  | "icecream" | "snack" | "fastfood" | "buffet" | "pub"
  | "karaoke" | "peña" | "roofbar" | "cocktail" | "craftbeer" | "pizza";

export type ExperienceEnvironment =
  | "indoor"
  | "outdoor"
  | "mixed";

export type WeatherSensitivity =
  | "low"
  | "medium"
  | "high";

export interface AffinityScores {
  firstTimeVisitor: number;
  family: number;
  couples: number;
  backpacker: number;
  photography: number;
  gastronomy: number;
  adventure: number;
  nightlife: number;
}

// 🏛️ Base primigenia de datos integrada aquí para eliminar la importación circular
export interface BaseExperience {
  experienceId: string;
  slug: string;
  title: string;
  city: string;
  image: string;
  description: string;
  latitude: number;
  longitude: number;
  link?: string;
  tags: string[];
  rating?: number;
  certificationRadiusMeters?: number;
  arrivalLatitude?: number;
  arrivalLongitude?: number;
  manualCertificationRadiusMeters?: number;
  environment?: ExperienceEnvironment;
  weatherSensitivity?: WeatherSensitivity;
  avoidWhenWet?: boolean;
  terrain?: "urban" | "paved" | "trail" | "clay" | "mountain";

  /**
   * La categoría del lugar y su relación comercial son datos
   * independientes. Si placeCategory no está definido, la UI usa type.
   */
  placeCategory?: PlaceCategory;
  listingStatus?: ListingStatus;
  
  // 🚀 EVOLUCIÓN ARQUITECTÓNICA: Cualquier experiencia puede responder a múltiples perfiles o intereses
  interests?: Interest[]; 
}

// 🏛️ Contrato de publicación extendido exigido por los datasets
export interface PublishableExperience extends BaseExperience {
  coverImage: string;
  gallery?: string[];
  isActive: boolean;
  lastUpdated?: string;
  estimatedVisitMinutes?: number; 
}

// =======================================================================
// 🔮 SUBTIPOS DEL CATÁLOGO EXTENDIENDO DE PUBLISHABLEEXPERIENCE
// =======================================================================

export interface ExpeditionExperience extends PublishableExperience {
  type: "expedition";
  distance: string;
  driveTime: string;
  walkTime: string;
  duration: string;
  difficulty: Difficulty;
  price: string;
  hospes: string;
  certificationRadiusMeters: number;
  affinity: AffinityScores; // Mantenido intacto para preservar compatibilidad legacy
}

// Un solo grupo para restaurante/café/bar/nightclub, con subtype para el matiz
export interface VenueExperience extends PublishableExperience {
  type: "restaurant" | "cafe" | "bar" | "nightclub";
  subtype?: VenueSubtype;
  cuisine?: string;
  priceRange?: "budget" | "mid" | "premium";
  openingHours?: string;
  admissionFee?: number;
  hasDelivery?: boolean;
  menuHighlights?: string[];
}

export interface HotelExperience extends PublishableExperience {
  type: "hotel";
  priceRange?: "budget" | "mid" | "premium";
  checkIn?: string;
  checkOut?: string;
  /**
   * Clasificación hotelera confirmada mediante una fuente oficial.
   * Su ausencia significa que la interfaz no debe mostrar estrellas.
   */
  officialStars?: 1 | 2 | 3 | 4 | 5;
  /**
   * Campo heredado de los hoteles demo. No acredita una clasificación
   * oficial y no debe utilizarse en la presentación pública.
   */
  stars?: number;
  amenities?: string[];
  roomTypes?: string[];
}

export interface MuseumExperience extends PublishableExperience {
  type: "museum";
  admissionFee: number;   
  openingHours: string;   
  guidedTours: boolean;   
  exhibitions: string[];  
}

export interface FestivalExperience extends PublishableExperience {
  type: "festival";
  category: "religious" | "cultural" | "music";
  date: string; 
  organizer: string;
  ticketUrl?: string;
  admissionFee: number;   
}

export interface EventExperience extends PublishableExperience {
  type: "event";
  category: "religious" | "cultural" | "music";
  date: string; 
  organizer: string;
  ticketUrl?: string;
  admissionFee: number;   
}

export interface CraftExperience extends PublishableExperience {
  type: "craft";
  specialty: string;
  openingHours: string;
}

// =======================================================================
// 🤖 HELPERS Y UNIÓN GLOBAL DISCRIMINADA
// =======================================================================

export type Experience =
  | ExpeditionExperience
  | VenueExperience
  | HotelExperience
  | MuseumExperience
  | FestivalExperience
  | CraftExperience
  | EventExperience;

export function isExpedition(
  experience: Experience
): experience is ExpeditionExperience {
  return experience.type === "expedition";
}
