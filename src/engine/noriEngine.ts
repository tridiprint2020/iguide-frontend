import type { UserProfile } from "../types/user/user";
import type { Experience } from "../types/experience";
import { expeditions } from "../data/experiences/expeditions/expeditions";

const traitHints: Record<string, string> = {
  firstTimeVisitor: "Perfecto para tu primera vez en la ciudad.",
  family: "Ideal para ir en familia.",
  couples: "Un lugar especial para compartir en pareja.",
  backpacker: "Auténtico y económico, ideal si viajas ligero.",
  photography: "Aquí encontrarás tomas espectaculares.",
  gastronomy: "Cerca hay sabores que no te puedes perder.",
  adventure: "Prepárate para algo de adrenalina.",
  nightlife: "Buena opción si buscas planes nocturnos.",
};

export function getExplorationProgress(visitedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((visitedCount / totalCount) * 100);
}

export function getPlaceHint(experience: Experience): string {
  if (experience.type !== "expedition")  {
    return "Una experiencia que vale la pena descubrir.";
  }

  const entries = Object.entries(experience.affinity) as [string, number][];
  const [topTrait] = entries.sort((a, b) => b[1] - a[1])[0];

  return traitHints[topTrait] ?? "Una experiencia que vale la pena descubrir.";
}

// 🎯 Tipos estrictos en inglés para los contextos lógicos de NORI
export type NoriContextId = "welcome_new" | "first_discovery" | "halfway" | "almost_done" | "high_level";

// 🗺️ Diccionario de traducción exclusivo para el componente visual (UI)
export const noriLabels: Record<NoriContextId, string> = {
  welcome_new: "¡Hola! Todavía no has explorado ningún rincón del mapa. ¡Elige tu primera aventura abajo! ✨",
  first_discovery: "¡Eso es! Ya diste tus primeros pasos. La ciudad empieza a recordar tus huellas. 🐾",
  halfway: "¡Impresionante! Ya conquistaste cerca de la mitad del Valle del Mantaro. ¡Sigue así! 🌎",
  almost_done: "¡Estás imparable! Te faltan muy pocas expediciones para completar el pasaporte de la ciudad. 🏆",
  high_level: "Tu nivel de explorador es altísimo. Hospes y yo estamos orgullosos de tu progreso. 👑"
};

/**
 * Analiza el perfil del explorador y determina qué mensaje contextual debe decir NORI.
 * Retorna el identificador en inglés (NoriContextId).
 */
export function getNoriContextMessage(user: UserProfile): NoriContextId {
  // CORRECCIÓN CLAVE: Pasamos números contables, no el objeto entero del usuario
  const visitedCount = user.visitedExperiences?.length || 0;
  const totalCount = expeditions?.length || 1;
  
  const progress = getExplorationProgress(visitedCount, totalCount);

  // 1. Prioridad por Nivel Alto (Gamificación)
  if (user.level >= 4) {
    return "high_level";
  }

  // 2. Prioridad por Progreso Geográfico (% del Valle)
  if (progress >= 80) {
    return "almost_done";
  }
  if (progress >= 40) {
    return "halfway";
  }
  if (progress >= 1) {
    return "first_discovery";
  }

  // 3. Estado inicial por defecto
  return "welcome_new";
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getProximityHint(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number
): string | null {
  const distance = getDistanceMeters(currentLat, currentLng, targetLat, targetLng);

  if (distance < 100) return "✦ ¡Ya llegaste! Este es un gran momento para una foto. 📸";
  if (distance < 300) return "✦ Estás muy cerca, ya casi llegas.";
  if (distance < 800) return "✦ Vas por buen camino, sigue así.";
  return null;
}