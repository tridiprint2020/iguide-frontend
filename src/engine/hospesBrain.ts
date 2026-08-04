import type { UserProfile } from "../types/user/user";
import type { WeatherStatus } from "./weatherEngine";
import type { HospesDecision } from "../types/hospesBrain";
import type { Experience } from "../types/experience";
import { getCurrentTimeContext } from "./timeEngine";
import { getRecommendations } from "./recommendationEngine";
import { isExpedition } from "../types/experience";

// 1. Obtiene la siguiente recomendación general disponible
function getNextSuggestion(profile: UserProfile): Experience | null {
  const ranked = getRecommendations({ profile });
  return ranked.find((e) => !profile.visitedExperiences.includes(e.experienceId)) ?? null;
}

// 2. Obtiene de forma segura una sugerencia que NO sea expedición (bajo techo)
function getIndoorSuggestion(profile: UserProfile): Experience | null {
  const ranked = getRecommendations({ profile });
  return ranked.find((e: Experience) => !profile.visitedExperiences.includes(e.experienceId) && !isExpedition(e)) ?? null;
}

export function getHospesDecision(profile: UserProfile, weather: WeatherStatus): HospesDecision {
  const timeContext = getCurrentTimeContext();
  
  // Manejo inteligente del clima lluvioso
  if (weather.condition === "drizzle" || weather.condition === "rain") {
    const indoorSuggestion = getIndoorSuggestion(profile);

    if (indoorSuggestion) {
      return {
        priority: "weather",
        title: "Día lluvioso en el valle",
        message: `La lluvia hace que ${indoorSuggestion.title} sea una excelente opción bajo techo.`,
        action: { type: "open-experience", target: indoorSuggestion.slug, label: "Ver el plan" },
      };
    }

    // Plan de contingencia si el catálogo indoor está vacío
    return {
      priority: "weather",
      title: "Está lloviendo afuera",
      message: "Un clima perfecto para refugiarse en un buen café o probar la gastronomía local.",
      action: { type: "open-category", target: "food", label: "Ver cafeterías y restaurantes" },
    };
  }

  // Comportamiento normal en días despejados
  const suggestion = getNextSuggestion(profile);

  if (timeContext.isNight) {
    return {
      priority: "time",
      title: "El día está terminando",
      message: "Buen momento para pensar en la cena o planear tu próxima ruta.",
      action: { type: "open-category", target: "food", label: "Ver restaurantes" },
    };
  }

  if (timeContext.isGoldenHour && profile.interests.includes("photography") && suggestion) {
    return {
      priority: "time",
      title: "Hora dorada",
      message: `La luz está perfecta ahora en ${suggestion.title}.`,
      action: { type: "open-experience", target: suggestion.slug, label: "Ir ahora" },
    };
  }

  if (suggestion) {
    // Discriminación de tipos limpia y segura
    const distanceText = isExpedition(suggestion) ? suggestion.driveTime : "poca distancia";
    return {
      priority: "progress",
      title: "Tengo una recomendación",
      message: `Creo que ${suggestion.title} encaja contigo, a ${distanceText} de aquí.`,
      action: { type: "open-experience", target: suggestion.slug, label: "Descubrir" },
    };
  }

  return {
    priority: "default",
    title: "Bienvenido",
    message: "El Valle del Mantaro te espera. Elige tu primera aventura.",
    action: { type: "open-itinerary", target: "", label: "Comenzar" },
  };
}
