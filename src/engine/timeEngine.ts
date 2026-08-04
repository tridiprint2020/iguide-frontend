/**
 * I.GUIDE - Time Engine
 * Control de rangos horarios y ventanas de iluminación natural para el Valle.
 */
export interface TimeContext {
  currentHour: number;
  isGoldenHour: boolean;
  isNight: boolean;
}

export function getCurrentTimeContext(): TimeContext {
  const currentHour = new Date().getHours();
  const isGoldenHour = currentHour >= 16 && currentHour < 18;
  const isNight = currentHour >= 18 || currentHour < 6;

  return { currentHour, isGoldenHour, isNight };
}

export type TimeOfDay = "morning" | "afternoon" | "night";

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 19) return "afternoon";
  return "night";
}

/**
 * Retorna una recomendación textual basada en la hora para que Hospes o NORI
 * la inyecten de forma contextual en las tarjetas o diálogos.
 */
export function getTimeTip(context: TimeContext): string {
  if (context.isGoldenHour) {
    return "La luz dorada del Valle está en su punto máximo. Ventana perfecta para fotografía de paisaje.";
  }
  if (context.isNight) {
    return "El sol se ha ocultado en el Valle. Es momento de priorizar la oferta gastronómica o actividades de interiores.";
  }
  return "Horario con iluminación cenital. Ideal para caminatas y expediciones de aventura en exteriores.";
}
