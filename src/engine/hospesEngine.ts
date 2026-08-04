// Tipos
import type { UserProfile } from "../types/user/user";
import type { WeatherStatus } from "./weatherEngine";
import type { ExplorerContext } from "../types/explorerContext";

// Datos
import { currentCity } from "../data/currentCity";
import { expeditions } from "../data/experiences/expeditions/expeditions";

// Hospes
import { getGreeting } from "../hospes/dialog";

// Motores
import { getRecommendations } from "./recommendationEngine";
import { getExplorationProgress } from "./journeyEngine";
import { getCurrentTimeContext } from "./timeEngine";

export function getHospesProgressMessage(user: UserProfile): string {
  const total = expeditions.length;
  const visited = user.visitedExperiences.length;
  const remaining = total - visited;
  const progress = getExplorationProgress(user, total);

  if (visited >= total) {
    return `Has completado el 100% del Valle. Eres un verdadero Embajador de ${currentCity}. 👑`;
  }

  if (visited === 0) {
    return `Aún no has comenzado. El Valle del Mantaro tiene ${total} rutas esperándote. ¡Da tu primer paso! ✨`;
  }

  if (progress < 40) {
    return `Vas muy bien. Llevas ${visited} de ${total} rutas. Sigue avanzando, cada paso cuenta. 🐾`;
  }

  if (progress < 80) {
    return `Ya casi la mitad. Te faltan ${remaining} rutas para completar el Valle. ¡No te detengas! 🌎`;
  }

  return `Estás muy cerca. Solo ${remaining} ${remaining === 1 ? "ruta" : "rutas"} más y conquistas todo ${currentCity}. 🏆`;
}

function getNextSuggestion(context: ExplorerContext) {
  const ranked = getRecommendations(context);

  return (
    ranked.find(
      (e) => !context.profile.visitedExperiences.includes(e.experienceId)
    ) ?? null
  );
}

function getSuggestionContext(suggestion: NonNullable<ReturnType<typeof getNextSuggestion>>): string {
  switch (suggestion.type) {
    case "expedition":
      return suggestion.driveTime
        ? `a ${suggestion.driveTime} de aquí`
        : "muy cerca de ti";

    case "restaurant":
    case "cafe":
      return "ideal para este momento del día";

    case "bar":
    case "nightclub":
      return "perfecto para disfrutar la noche";

    case "hotel":
      return "una excelente opción para descansar";

    case "museum":
      return "ideal para descubrir la cultura local";

    case "festival":
      return "una experiencia única del Valle";

    case "craft":
      return "perfecto para conocer la artesanía local";

    default:
      return "muy cerca de ti";
  }
}

export function getHospesMessage(
  user: UserProfile,
  weather: WeatherStatus
): string {

  const timeContext = getCurrentTimeContext();

  const greeting =
    `${getGreeting()} ${user.name}. Bienvenido a ${currentCity}.`;

  const context: ExplorerContext = {
    profile: user,
  };

  const total = expeditions.length;
  const visited = user.visitedExperiences.length;
  const progress = getExplorationProgress(user, total);
  const suggestion = getNextSuggestion(context);

  if (visited >= total) {
    return `${greeting} Has completado el 100% del Valle. Eres un verdadero Embajador de ${currentCity}. 👑`;
  }

  if (timeContext.isNight) {
    return `${greeting} El sol ya se ocultó en el Valle. Buen momento para pensar en la cena o descansar para tu próxima aventura.`;
  }

  if (
    (weather.condition === "drizzle" ||
      weather.condition === "rain") &&
    suggestion
  ) {
    return `${greeting} Hay riesgo de lluvia en las alturas. Te sugiero ${suggestion.title}, ${getSuggestionContext(suggestion)}.`;
  }

  if (
    timeContext.isGoldenHour &&
    user.interests.includes("photography") &&
    suggestion
  ) {
    return `${greeting} Estamos en la hora dorada. ${suggestion.title} sería una excelente elección para aprovechar la luz.`;
  }

  if (suggestion) {
    return `${greeting} Llevas ${visited} de ${total} experiencias descubiertas (${progress}%). Mi recomendación es ${suggestion.title}, ${getSuggestionContext(suggestion)}.`;
  }

  return `${greeting} El Valle del Mantaro te espera. ¡Elige tu primera aventura!`;
}