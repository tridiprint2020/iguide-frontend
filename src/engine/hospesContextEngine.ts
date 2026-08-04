import type { Experience } from "../types/experience";
import type { TimelineItem } from "../types/tracking/tracking";
import type { HospesMessage } from "../types/hospes";
import type { WeatherStatus } from "./weatherEngine";

export type HospesScreen =
  | "home"
  | "explorer"
  | "expedition"
  | "walking"
  | "memory"
  | "completed";

export type HospesProgress = {
  visitedCount: number;
  totalCount: number;
};

export type HospesContext = {
  screen: HospesScreen;

  userName?: string;

  weather?: WeatherStatus | null;

  experience?: Experience | null;

  suggestedExperience?: Experience | null;

  timeline?: TimelineItem[];

  distanceToTargetMeters?: number;

  rewardXp?: number;

  progress?: HospesProgress;

  currentDate?: Date;
};

type OpeningStatus = {
  hasSchedule: boolean;
  isOpen: boolean;
  opensAt?: string;
  closesAt?: string;
};

const BRAND_COLOR =
  "#FF00FF";

const SUCCESS_COLOR =
  "#FF00FF";

const WARNING_COLOR =
  "#FF8A00";

function formatDistance(
  distanceMeters?: number
): string | null {
  if (
    typeof distanceMeters !==
      "number" ||
    !Number.isFinite(
      distanceMeters
    )
  ) {
    return null;
  }

  if (
    distanceMeters < 1000
  ) {
    return `${Math.max(
      0,
      Math.round(
        distanceMeters
      )
    )} metros`;
  }

  return `${(
    distanceMeters / 1000
  ).toFixed(1)} km`;
}

function getTimeLabel(
  date: Date
): string {
  const hour =
    date.getHours();

  if (hour < 6) {
    return "esta madrugada";
  }

  if (hour < 12) {
    return "esta mañana";
  }

  if (hour < 18) {
    return "esta tarde";
  }

  return "esta noche";
}

function getOpeningStatus(
  experience:
    | Experience
    | null
    | undefined,

  currentDate: Date
): OpeningStatus {
  if (
    !experience ||
    !(
      "openingHours" in
      experience
    ) ||
    typeof experience
      .openingHours !==
      "string"
  ) {
    return {
      hasSchedule: false,
      isOpen: true,
    };
  }

  const normalized =
    experience.openingHours
      .trim();

  const match =
    normalized.match(
      /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/
    );

  if (!match) {
    return {
      hasSchedule: false,
      isOpen: true,
    };
  }

  const openHour =
    Number(match[1]);

  const openMinute =
    Number(match[2]);

  const closeHour =
    Number(match[3]);

  const closeMinute =
    Number(match[4]);

  const currentMinutes =
    currentDate.getHours() *
      60 +
    currentDate.getMinutes();

  const openMinutes =
    openHour * 60 +
    openMinute;

  const closeMinutes =
    closeHour * 60 +
    closeMinute;

  const isOpen =
    closeMinutes >=
    openMinutes
      ? currentMinutes >=
          openMinutes &&
        currentMinutes <=
          closeMinutes
      : currentMinutes >=
          openMinutes ||
        currentMinutes <=
          closeMinutes;

  return {
    hasSchedule: true,

    isOpen,

    opensAt:
      `${String(
        openHour
      ).padStart(
        2,
        "0"
      )}:${String(
        openMinute
      ).padStart(
        2,
        "0"
      )}`,

    closesAt:
      `${String(
        closeHour
      ).padStart(
        2,
        "0"
      )}:${String(
        closeMinute
      ).padStart(
        2,
        "0"
      )}`,
  };
}

export function getHospesMessage(
  context: HospesContext
): HospesMessage {
  const {
    screen,

    userName,

    experience,

    suggestedExperience,

    timeline = [],

    distanceToTargetMeters,

    rewardXp = 150,

    progress,

    weather,

    currentDate =
      new Date(),
  } = context;

  const memories =
    timeline.filter(
      (item) =>
        item.type ===
        "memory"
    );

  const routeEvents =
    timeline.filter(
      (item) =>
        item.type ===
          "start" ||
        item.type ===
          "walk" ||
        item.type ===
          "abort" ||
        item.type ===
          "finish"
    );

  const hasFinish =
    timeline.some(
      (item) =>
        item.type ===
        "finish"
    );

  const hasAbort =
    timeline.some(
      (item) =>
        item.type ===
        "abort"
    );

  const distanceLabel =
    formatDistance(
      distanceToTargetMeters
    );

  const timeLabel =
    getTimeLabel(
      currentDate
    );

  const openingStatus =
    getOpeningStatus(
      experience,
      currentDate
    );

  switch (screen) {
    case "home": {
      const hour =
        currentDate.getHours();

      /*
       * Hospes conserva su lógica estable
       * basada en la hora local.
       */
      const isNight =
        hour >= 18 ||
        hour < 6;

      const greeting =
        hour < 6
          ? "La ciudad todavía duerme"
          : hour < 12
            ? "Buenos días"
            : hour < 18
              ? "Buenas tardes"
              : "Buenas noches";

      const personalGreeting =
        userName
          ? `${greeting}, ${userName}.`
          : `${greeting}.`;

      let opening: string;

      if (
        isNight &&
        hour < 6
      ) {
        opening =
          `${personalGreeting} Huancayo está en silencio, ` +
          "pero algunas de sus mejores historias comienzan antes que el resto.";
      } else if (
        isNight
      ) {
        opening =
          `${personalGreeting} Huancayo ya encendió su vida nocturna.`;
      } else if (
        hour < 12
      ) {
        opening =
          `${personalGreeting} Huancayo acaba de comenzar ` +
          "y todavía tenemos todo el día para descubrirlo.";
      } else {
        opening =
          `${personalGreeting} La ciudad todavía tiene algo preparado para ti.`;
      }

      let weatherObservation =
        "";

      if (weather) {
        switch (
          weather.condition
        ) {
          case "rain":
            weatherObservation =
              " Está lloviendo en el Valle, así que elegí una experiencia cómoda y protegida.";
            break;

          case "drizzle":
            weatherObservation =
              " Hay llovizna en el Valle, así que elegí una experiencia cómoda y segura.";
            break;

          case "sunny":
            weatherObservation =
              isNight
                ? " El cielo está despejado y la noche permite continuar explorando con calma."
                : " El cielo está despejado: es un buen momento para caminar y descubrir la ciudad.";
            break;

          case "cloudy":
            weatherObservation =
              isNight
                ? " La noche está nublada, así que prioricé una experiencia urbana y accesible."
                : " El cielo está nublado, una condición cómoda para recorrer la ciudad.";
            break;

          case "snow":
            weatherObservation =
              " Las condiciones de montaña requieren precaución, así que prioricé experiencias urbanas.";
            break;

          default:
            weatherObservation =
              "";
        }
      }

      const unsafeOutdoorWeather =
        weather?.condition ===
          "rain" ||
        weather?.condition ===
          "drizzle" ||
        weather?.condition ===
          "snow";

      const recommendationWarning =
        unsafeOutdoorWeather &&
        suggestedExperience
          ? " Elegí una alternativa bajo techo para que disfrutes la ciudad con comodidad."
          : "";

      const suggestionObservation =
        suggestedExperience
          ? ` Mi elección es ${suggestedExperience.title}.`
          : " Tengo varias posibilidades listas para ti.";

      const closing =
        suggestedExperience
          ? " ¿Vamos?"
          : " Dime cómo quieres sentir la ciudad y prepararé el siguiente paso.";

      return {
        title:
          "HOSPES · FEEL THE CITY",

        message:
          opening +
          weatherObservation +
          recommendationWarning +
          suggestionObservation +
          closing,

        icon:
          weather?.condition ===
            "rain" ||
          weather?.condition ===
            "drizzle"
            ? "🌦️"
            : isNight
              ? "🌙"
              : "🧭",

        color:
          BRAND_COLOR,

        tone: "brand",

        action:
          suggestedExperience
            ? {
                type:
                  "open-experience",

                target:
                  suggestedExperience.slug,

                label:
                  `Descubrir ${suggestedExperience.title}`,
              }
            : {
                type:
                  "open-map",

                target:
                  "/explorer",

                label:
                  "Explorar Huancayo",
              },
      };
    }

    case "explorer": {
      const visitedCount =
        progress?.visitedCount ??
        0;

      const totalCount =
        progress?.totalCount ??
        0;

      const progressText =
        totalCount > 0
          ? `Ya descubriste ${visitedCount} de ${totalCount} experiencias disponibles.`
          : "Tengo experiencias listas para ti.";

      const suggestionText =
        suggestedExperience
          ? ` Mi recomendación ${timeLabel} es ${suggestedExperience.title}.`
          : " Elige una y te acompañaré durante todo el recorrido.";

      return {
        title:
          "FEEL THE CITY",

        message:
          `${progressText}${suggestionText}`,

        icon: "🧭",

        color:
          BRAND_COLOR,

        tone: "brand",

        action:
          suggestedExperience
            ? {
                type:
                  "open-experience",

                target:
                  suggestedExperience.slug,

                label:
                  `Ver ${suggestedExperience.title}`,
              }
            : {
                type:
                  "open-map",

                target:
                  "/mapa",

                label:
                  "Explorar el mapa",
              },
      };
    }

    case "expedition": {
      if (!experience) {
        return {
          title:
            "Tu próxima experiencia",

          message:
            "Elige un destino y prepararé el recorrido contigo.",

          icon: "📍",

          color:
            BRAND_COLOR,

          tone: "brand",
        };
      }

      if (
        openingStatus
          .hasSchedule &&
        !openingStatus.isOpen
      ) {
        return {
          title:
            `${experience.title} está cerrado`,

          message:
            `${experience.title} abre a las ${openingStatus.opensAt}. ` +
            "Puedes guardar el plan o explorar otra experiencia cercana mientras tanto.",

          icon: "🕒",

          color:
            WARNING_COLOR,

          tone: "warning",

          action: {
            type:
              "open-map",

            target:
              "/mapa",

            label:
              "Ver alternativas",
          },
        };
      }

      const scheduleText =
        openingStatus
          .hasSchedule
          ? ` Está abierto hasta las ${openingStatus.closesAt}.`
          : "";

      return {
        title:
          experience.title,

        message:
          `Puedo registrar tu ruta, tus recuerdos y tu llegada.${scheduleText}`,

        icon:
          experience.type ===
          "restaurant"
            ? "🍽️"
            : "📍",

        color:
          BRAND_COLOR,

        tone: "brand",

        action: {
          type:
            "open-experience",

          target:
            experience.slug,

          label:
            "Comenzar experiencia",
        },
      };
    }

    case "walking": {
      if (hasFinish) {
        return {
          title:
            "Llegada registrada",

          message:
            `Ya reconocí tu llegada a ${experience?.title ?? "el destino"}. ` +
            "Estoy preparando tu recompensa y el resumen del recorrido.",

          icon: "🏁",

          color:
            SUCCESS_COLOR,

          tone: "success",
        };
      }

      if (hasAbort) {
        return {
          title:
            "Ruta conservada",

          message:
            "El recorrido quedó guardado. Podrás revisarlo y compartirlo desde Explorer.",

          icon: "🟠",

          color:
            WARNING_COLOR,

          tone: "warning",

          action: {
            type:
              "open-map",

            target:
              "/explorer",

            label:
              "Ver mi recorrido",
          },
        };
      }

      if (
        typeof distanceToTargetMeters ===
          "number" &&
        distanceToTargetMeters <=
          50
      ) {
        return {
          title:
            "Ya casi llegas",

          message:
            memories.length > 0
              ? `Estás dentro del área de ${experience?.title ?? "llegada"}. Ya tienes un recuerdo y puedo certificar esta experiencia.`
              : `Estás muy cerca de ${experience?.title ?? "tu destino"}. Guarda una foto o una nota para certificar la visita.`,

          icon: "📍",

          color:
            memories.length > 0
              ? SUCCESS_COLOR
              : WARNING_COLOR,

          tone:
            memories.length > 0
              ? "success"
              : "warning",
        };
      }

      if (
        memories.length > 0
      ) {
        return {
          title:
            "Tu historia está creciendo",

          message:
            `Ya guardaste ${memories.length} ${
              memories.length === 1
                ? "recuerdo"
                : "recuerdos"
            } durante esta ruta.` +
            (
              distanceLabel
                ? ` Faltan aproximadamente ${distanceLabel}.`
                : ""
            ),

          icon: "📸",

          color:
            BRAND_COLOR,

          tone: "brand",
        };
      }

      if (
        routeEvents.length > 1
      ) {
        return {
          title:
            "Te acompaño",

          message:
            `La ruta está activa hacia ${experience?.title ?? "tu destino"}.` +
            (
              distanceLabel
                ? ` Estás a ${distanceLabel}.`
                : " Seguiré registrando el recorrido."
            ),

          icon: "🥾",

          color:
            BRAND_COLOR,

          tone: "brand",
        };
      }

      return {
        title:
          "Preparando tu recorrido",

        message:
          "Estoy estabilizando la señal GPS para registrar una ruta más limpia y precisa.",

        icon: "🛰️",

        color:
          BRAND_COLOR,

        tone: "info",
      };
    }

    case "memory":
      return {
        title:
          "Recuerdo asegurado",

        message:
          `La ubicación quedó guardada en tu Timeline. Ya tienes ${memories.length} ${
            memories.length === 1
              ? "recuerdo"
              : "recuerdos"
          } en esta experiencia.`,

        icon: "📸",

        color:
          BRAND_COLOR,

        tone: "brand",
      };

    case "completed":
      return {
        title:
          `+${rewardXp} XP`,

        message:
          experience
            ? `Completaste ${experience.title}. La ruta, tus recuerdos y la llegada quedaron guardados en tu pasaporte.`
            : "La experiencia quedó certificada y añadida a tu historial.",

        icon: "🏅",

        color:
          SUCCESS_COLOR,

        tone: "success",

        action: {
          type:
            "open-map",

          target:
            "/explorer",

          label:
            "Seguir explorando",
        },
      };

    default:
      return {
        title:
          "FEEL THE CITY",

        message:
          "Hospes está listo para acompañarte.",

        icon: "🧭",

        color:
          BRAND_COLOR,

        tone: "brand",
      };
  }
}