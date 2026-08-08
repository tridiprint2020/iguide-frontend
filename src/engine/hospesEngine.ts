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
import { tx } from "../i18n";

export function getHospesProgressMessage(user: UserProfile): string {
  const total = expeditions.length;
  const visited = user.visitedExperiences.length;
  const remaining = total - visited;
  const progress = getExplorationProgress(user, total);

  if (visited >= total) {
    return tx("Has completado el 100% del Valle. Eres un verdadero Embajador de {{city}}. 👑", { city: currentCity });
  }

  if (visited === 0) {
    return tx("Aún no has comenzado. El Valle del Mantaro tiene {{total}} rutas esperándote. ¡Da tu primer paso! ✨", { total });
  }

  if (progress < 40) {
    return tx("Vas muy bien. Llevas {{visited}} de {{total}} rutas. Sigue avanzando, cada paso cuenta. 🐾", { visited, total });
  }

  if (progress < 80) {
    return tx("Ya casi la mitad. Te faltan {{remaining}} rutas para completar el Valle. ¡No te detengas! 🌎", { remaining });
  }

  return tx(
    remaining === 1
      ? "Estás muy cerca. Solo {{remaining}} ruta más y conquistas todo {{city}}. 🏆"
      : "Estás muy cerca. Solo {{remaining}} rutas más y conquistas todo {{city}}. 🏆",
    { remaining, city: currentCity }
  );
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
        ? tx("a {{time}} de aquí", { time: suggestion.driveTime })
        : tx("muy cerca de ti");

    case "restaurant":
    case "cafe":
      return tx("ideal para este momento del día");

    case "bar":
    case "nightclub":
      return tx("perfecto para disfrutar la noche");

    case "hotel":
      return tx("una excelente opción para descansar");

    case "museum":
      return tx("ideal para descubrir la cultura local");

    case "festival":
      return tx("una experiencia única del Valle");

    case "craft":
      return tx("perfecto para conocer la artesanía local");

    default:
      return tx("muy cerca de ti");
  }
}

export function getHospesMessage(
  user: UserProfile,
  weather: WeatherStatus
): string {

  const timeContext = getCurrentTimeContext();

  const greeting =
    tx("{{greeting}} {{name}}. Bienvenido a {{city}}.", {
      greeting: tx(getGreeting()),
      name: user.name,
      city: currentCity,
    });

  const context: ExplorerContext = {
    profile: user,
  };

  const total = expeditions.length;
  const visited = user.visitedExperiences.length;
  const progress = getExplorationProgress(user, total);
  const suggestion = getNextSuggestion(context);

  if (visited >= total) {
    return `${greeting} ${tx("Has completado el 100% del Valle. Eres un verdadero Embajador de {{city}}. 👑", { city: currentCity })}`;
  }

  if (timeContext.isNight) {
    return `${greeting} ${tx("El sol ya se ocultó en el Valle. Buen momento para pensar en la cena o descansar para tu próxima aventura.")}`;
  }

  if (
    (weather.condition === "drizzle" ||
      weather.condition === "rain") &&
    suggestion
  ) {
    return `${greeting} ${tx("Hay riesgo de lluvia en las alturas. Te sugiero {{title}}, {{context}}.", { title: suggestion.title, context: getSuggestionContext(suggestion) })}`;
  }

  if (
    timeContext.isGoldenHour &&
    user.interests.includes("photography") &&
    suggestion
  ) {
    return `${greeting} ${tx("Estamos en la hora dorada. {{title}} sería una excelente elección para aprovechar la luz.", { title: suggestion.title })}`;
  }

  if (suggestion) {
    return `${greeting} ${tx("Llevas {{visited}} de {{total}} experiencias descubiertas ({{progress}}%). Mi recomendación es {{title}}, {{context}}.", { visited, total, progress, title: suggestion.title, context: getSuggestionContext(suggestion) })}`;
  }

  return `${greeting} ${tx("El Valle del Mantaro te espera. ¡Elige tu primera aventura!")}`;
}
