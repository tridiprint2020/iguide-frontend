import { catalog } from "../data/catalog";
import type { Experience, ExperienceType } from "../types/experience/experience";
import type { Interest } from "../types/interest";

// =======================================================================
// 🏛️ FUNCIONES NOMBRADAS (Mantiene compatibilidad con el código existente)
// =======================================================================

export function getAllExperiences(): Experience[] {
  return catalog;
}

export function getExperienceBySlug(slug: string): Experience | undefined {
  return catalog.find((experience) => experience.slug === slug);
}

export function getExperienceById(experienceId: string): Experience | undefined {
  return catalog.find((experience) => experience.experienceId === experienceId);
}

export function getExperiencesByType(type: ExperienceType): Experience[] {
  return catalog.filter((experience) => experience.type === type);
}

export function getExperiencesByTag(tag: string): Experience[] {
  return catalog.filter((experience) => experience.tags.includes(tag));
}

/**
 * Filtra colecciones basándose en el arreglo polimórfico de intereses.
 */
export function getExperiencesByInterest(interest: Interest): Experience[] {
  return catalog.filter((experience) => experience.interests?.includes(interest));
}

export function countExperiencesByTag(tag: string): number {
  return catalog.filter((experience) => experience.tags.includes(tag)).length;
}

export function searchExperiences(query: string): Experience[] {
  const lower = query.toLowerCase();
  return catalog.filter(
    (experience) =>
      experience.title.toLowerCase().includes(lower) ||
      experience.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

// =======================================================================
// 🚀 FACHADA DE DOMINIO ÚNICA (Nueva puerta de acceso centralizada)
// =======================================================================

export const ExperienceEngine = {
  getAll: getAllExperiences,
  getBySlug: getExperienceBySlug,
  getById: getExperienceById,
  getByType: getExperiencesByType,
  getByTag: getExperiencesByTag,
  getByInterest: getExperiencesByInterest,
  countByTag: countExperiencesByTag,
  search: searchExperiences,
};
