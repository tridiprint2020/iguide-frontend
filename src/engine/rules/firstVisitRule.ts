import type { UserProfile } from "../../types/user/user";
// ✅ CORREGIDO: Consumo directo del Union Type unificado
import type { Experience } from "../../types/experience/experience";

interface RuleResult {
  isEligible: boolean;
  reason?: string;
}

/**
 * Evalúa si el explorador califica para bonificaciones de primera visita en el destino
 */
export function evaluateFirstVisitRule(user: UserProfile, experience: Experience): RuleResult {
  if (!user || !experience) {
    return { isEligible: false, reason: "Datos de usuario o experiencia inválidos." };
  }

  // Verificamos si la experiencia ya fue certificada en el pasaporte histórico del usuario
  const hasVisited = user.visitedExperiences.includes(experience.experienceId);

  if (hasVisited) {
    return {
      isEligible: false,
      reason: "Hospes detectó que este destino ya cuenta con sello oficial en tu pasaporte.",
    };
  }

  return {
    isEligible: true,
  };
}
