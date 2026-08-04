import { ExperienceEngine } from "./experienceEngine";
import { loadTrack } from "./trackingEngine";
import type { UserProfile } from "../types/user/user";

export interface PassportSummary {
  certifiedCount: number;
  totalExpeditions: number;
  progressPercent: number;
  completedSlugs: string[];
}

/**
 * 🏛️ PASSPORT ENGINE — LÓGICA DE CERTIFICACIÓN PURA
 * Calcula el progreso del pasaporte leyendo los tracks reales guardados en el dispositivo.
 */
export const PassportEngine = {
  /**
   * Genera el resumen oficial del pasaporte sin almacenar copias de datos de negocio.
   */
  getSummary(_user: UserProfile): PassportSummary {
    const allExpeditions = ExperienceEngine.getByType("expedition");
    const totalExpeditions = allExpeditions.length;

    // Filtrar cuáles de las expediciones del catálogo tienen un track completado real en disco
    const completedSlugs = allExpeditions
      .filter((exp) => {
        const track = loadTrack(exp.experienceId);
        return track !== null && track.completedAt !== undefined;
      })
      .map((exp) => exp.slug);

    const certifiedCount = completedSlugs.length;
    const progressPercent = totalExpeditions > 0 
      ? Math.round((certifiedCount / totalExpeditions) * 100) 
      : 0;

    return {
      certifiedCount,
      totalExpeditions,
      progressPercent,
      completedSlugs
    };
  }
};
