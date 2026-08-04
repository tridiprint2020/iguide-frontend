import type { UserProfile } from "../types/user/user";

// 🏆 1. Tipos estrictos en inglés para la lógica de logros
export type AchievementId = "first_steps" | "local_master" | "pro_photographer";

// 🏅 2. Tipos estrictos en inglés para los rangos de nivel
export type ExplorerRank = "initiated" | "expert" | "ambassador";

// 🗺️ Diccionario de traducción exclusivo para uso en componentes visuales (UI)
export const achievementLabels: Record<AchievementId, { title: string; description: string }> = {
  first_steps: {
    title: "Primeros Pasos",
    description: "Completaste tu primera expedición oficial en la plataforma."
  },
  local_master: {
    title: "Conquistador Local",
    description: "Completaste 3 o más expediciones en la ciudad actual."
  },
  pro_photographer: {
    title: "Ojo de Halcón",
    description: "Alcanzaste el nivel 3 teniendo la fotografía como interés principal."
  }
};

export const rankLabels: Record<ExplorerRank, string> = {
  initiated: "Explorador Iniciado",
  expert: "Rastreador Experto",
  ambassador: "Embajador de la Ciudad"
};

/**
 * Evalúa el estado del pasaporte del usuario para ver si califica para nuevos logros.
 * Retorna una lista con los IDs de las nuevas insignias desbloqueadas.
 */
export function evaluateAchievements(user: UserProfile): AchievementId[] {
  const newAchievements: AchievementId[] = [];

  // Logro: First Steps
  if (user.visitedExperiences.length >= 1 && !user.achievements.includes("first_steps")) {
    newAchievements.push("first_steps");
  }

  // Logro: Local Master (Prevenido para cuando cambiemos 'city' a tipos en inglés)
  // Por ahora evalúa la cantidad total, pero está listo para filtrar por ciudad.
  if (user.visitedExperiences.length >= 3 && !user.achievements.includes("local_master")) {
    newAchievements.push("local_master");
  }

  // Logro: Pro Photographer
  if (user.level >= 3 && user.interests.includes("photography") && !user.achievements.includes("pro_photographer")) {
    newAchievements.push("pro_photographer");
  }

  return newAchievements;
}

/**
 * Calcula cuánta experiencia le falta al usuario para alcanzar el siguiente nivel.
 * Estándar de diseño: 300 XP por nivel.
 */
export function getXPToNextLevel(experience: number): number {
  const currentLevelXP = experience % 300;
  return 300 - currentLevelXP;
}

/**
 * Retorna el identificador del rango en inglés basado en el nivel numérico.
 */
export function getExplorerRank(level: number): ExplorerRank {
  if (level >= 5) return "ambassador";
  if (level >= 3) return "expert";
  return "initiated";
}
