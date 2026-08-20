import type { Experience } from "../types/experience";
import type { TimelineItem } from "../types/tracking/tracking";
import type { HospesMessage } from "../types/hospes";
import type { WeatherStatus } from "./weatherEngine";
import { tx } from "../i18n";

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
    return tx(
      "{{distance}} metros",
      {
        distance: Math.max(
          0,
          Math.round(
            distanceMeters
          )
        ),
      }
    );
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
    return tx("esta madrugada");
  }

  if (hour < 12) {
    return tx("esta mañana");
  }

  if (hour < 18) {
    return tx("esta tarde");
  }

  return tx("esta noche");
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
          ? tx("La ciudad todavía duerme")
          : hour < 12
            ? tx("Buenos días")
            : hour < 18
              ? tx("Buenas tardes")
              : tx("Buenas noches");

      const personalGreeting =
        userName
          ? tx(
              "{{greeting}}, {{name}}.",
              {
                greeting,
                name: userName,
              }
            )
          : tx(
              "{{greeting}}.",
              {
                greeting,
              }
            );

      let opening: string;

      if (
        isNight &&
        hour < 6
      ) {
        opening =
          tx(
            "{{greeting}} Huancayo está en silencio, pero algunas de sus mejores historias comienzan antes que el resto.",
            {
              greeting:
                personalGreeting,
            }
          );
      } else if (
        isNight
      ) {
        opening =
          tx(
            "{{greeting}} Huancayo ya encendió su vida nocturna.",
            {
              greeting:
                personalGreeting,
            }
          );
      } else if (
        hour < 12
      ) {
        opening =
          tx(
            "{{greeting}} Huancayo acaba de comenzar y todavía tenemos todo el día para descubrirlo.",
            {
              greeting:
                personalGreeting,
            }
          );
      } else {
        opening =
          tx(
            "{{greeting}} La ciudad todavía tiene algo preparado para ti.",
            {
              greeting:
                personalGreeting,
            }
          );
      }

      let weatherObservation =
        "";

      const nearRainRisk =
        (weather?.precipitationProbabilityNext3Hours ?? 0) >= 40;

      if (weather) {
        switch (
          weather.condition
        ) {
          case "rain":
            weatherObservation =
              ` ${tx("Está lloviendo en el Valle, así que elegí una experiencia cómoda y protegida.")}`;
            break;

          case "drizzle":
            weatherObservation =
              ` ${tx("Hay llovizna en el Valle, así que elegí una experiencia cómoda y segura.")}`;
            break;

          case "sunny":
            weatherObservation =
              isNight
                ? ` ${tx("El cielo está despejado y la noche permite continuar explorando con calma.")}`
                : ` ${tx("El cielo está despejado: es un buen momento para caminar y descubrir la ciudad.")}`;
            break;

          case "cloudy":
            weatherObservation =
              nearRainRisk
                ? ` ${tx("El cielo está nublado y hay posibilidad de lluvia pronto, así que elegí una experiencia bajo techo.")}`
                : isNight
                ? ` ${tx("La noche está nublada, así que prioricé una experiencia urbana y accesible.")}`
                : ` ${tx("El cielo está nublado, una condición cómoda para recorrer la ciudad.")}`;
            break;

          case "snow":
            weatherObservation =
              ` ${tx("Las condiciones de montaña requieren precaución, así que prioricé experiencias urbanas.")}`;
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
          "snow" ||
        nearRainRisk;

      const recommendationWarning =
        unsafeOutdoorWeather &&
        suggestedExperience
          ? ` ${tx("Elegí una alternativa bajo techo para que disfrutes la ciudad con comodidad.")}`
          : "";

      const suggestionObservation =
        suggestedExperience
          ? ` ${tx("Mi elección es {{title}}.", { title: suggestedExperience.title })}`
          : unsafeOutdoorWeather
            ? ` ${tx("Por seguridad, hoy no te propondré una misión al aire libre. Puedes revisar alternativas bajo techo y confirmar sus horarios.")}`
            : ` ${tx("Tengo varias posibilidades listas para ti.")}`;

      const closing =
        suggestedExperience
          ? ` ${tx("¿Vamos?")}`
          : ` ${tx("Dime cómo quieres sentir la ciudad y prepararé el siguiente paso.")}`;

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
                  "start-journey",

                target:
                  suggestedExperience.slug,

                label:
                  tx(
                    "Iniciar misión: {{title}}",
                    {
                      title:
                        suggestedExperience.title,
                    }
                  ),
              }
            : {
                type:
                  "open-map",

                target:
                  "/explorer",

                label:
                  tx("Explorar Huancayo"),
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
          ? tx(
              "Ya descubriste {{visited}} de {{total}} experiencias disponibles.",
              {
                visited:
                  visitedCount,
                total:
                  totalCount,
              }
            )
          : tx("Tengo experiencias listas para ti.");

      const suggestionText =
        suggestedExperience
          ? ` ${tx("Mi recomendación {{time}} es {{title}}.", { time: timeLabel, title: suggestedExperience.title })}`
          : ` ${tx("Elige una y te acompañaré durante todo el recorrido.")}`;

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
                  tx(
                    "Ver {{title}}",
                    {
                      title:
                        suggestedExperience.title,
                    }
                  ),
              }
            : {
                type:
                  "open-map",

                target:
                  "/mapa",

                label:
                  tx("Explorar el mapa"),
              },
      };
    }

    case "expedition": {
      if (!experience) {
        return {
          title:
            tx("Tu próxima experiencia"),

          message:
            tx("Elige un destino y prepararé el recorrido contigo."),

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
            tx(
              "{{title}} está cerrado",
              {
                title:
                  experience.title,
              }
            ),

          message:
            tx(
              "{{title}} abre a las {{time}}. Puedes guardar el plan o explorar otra experiencia cercana mientras tanto.",
              {
                title:
                  experience.title,
                time:
                  openingStatus.opensAt,
              }
            ),

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
              tx("Ver alternativas"),
          },
        };
      }

      const scheduleText =
        openingStatus
          .hasSchedule
          ? ` ${tx("Está abierto hasta las {{time}}.", { time: openingStatus.closesAt })}`
          : "";

      return {
        title:
          tx("HOSPES · TU MISIÓN"),

        message:
          tx(
            "Puedo registrar tu ruta, tus recuerdos y tu llegada.{{schedule}}",
            {
              schedule:
                scheduleText,
            }
          ),

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
            tx("Comenzar experiencia"),
        },
      };
    }

    case "walking": {
      if (hasFinish) {
        return {
          title:
            tx("Llegada registrada"),

          message:
            tx(
              "Ya reconocí tu llegada a {{title}}. Estoy preparando tu recompensa y el resumen del recorrido.",
              {
                title:
                  experience?.title ??
                  tx("el destino"),
              }
            ),

          icon: "🏁",

          color:
            SUCCESS_COLOR,

          tone: "success",
        };
      }

      if (hasAbort) {
        return {
          title:
            tx("Ruta conservada"),

          message:
            tx("El recorrido quedó guardado. Podrás revisarlo y compartirlo desde Explorer."),

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
              tx("Ver mi recorrido"),
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
            tx("Ya casi llegas"),

          message:
            memories.length > 0
              ? tx(
                  "Estás dentro del área de {{title}}. Ya tienes un recuerdo y puedo certificar esta experiencia.",
                  {
                    title:
                      experience?.title ??
                      tx("llegada"),
                  }
                )
              : tx(
                  "Estás muy cerca de {{title}}. La llegada se certificará con el GPS; una foto o nota es opcional.",
                  {
                    title:
                      experience?.title ??
                      tx("tu destino"),
                  }
                ),

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
            tx("Tu historia está creciendo"),

          message:
            tx(
              memories.length === 1
                ? "Ya guardaste {{count}} recuerdo durante esta ruta."
                : "Ya guardaste {{count}} recuerdos durante esta ruta.",
              {
                count:
                  memories.length,
              }
            ) +
            (
              distanceLabel
                ? ` ${tx("Faltan aproximadamente {{distance}}.", { distance: distanceLabel })}`
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
            tx("Te acompaño"),

          message:
            tx(
              "La ruta está activa hacia {{title}}.",
              {
                title:
                  experience?.title ??
                  tx("tu destino"),
              }
            ) +
            (
              distanceLabel
                ? ` ${tx("Estás a {{distance}}.", { distance: distanceLabel })}`
                : ` ${tx("Seguiré registrando el recorrido.")}`
            ),

          icon: "🥾",

          color:
            BRAND_COLOR,

          tone: "brand",
        };
      }

      return {
        title:
          tx("Preparando tu recorrido"),

        message:
          tx("Estoy estabilizando la señal GPS para registrar una ruta más limpia y precisa."),

        icon: "🛰️",

        color:
          BRAND_COLOR,

        tone: "info",
      };
    }

    case "memory":
      return {
        title:
          tx("Recuerdo asegurado"),

        message:
          tx(
            memories.length === 1
              ? "La ubicación quedó guardada en tu Timeline. Ya tienes {{count}} recuerdo en esta experiencia."
              : "La ubicación quedó guardada en tu Timeline. Ya tienes {{count}} recuerdos en esta experiencia.",
            {
              count:
                memories.length,
            }
          ),

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
            ? tx(
                "Completaste {{title}}. La ruta, tus recuerdos y la llegada quedaron guardados en tu pasaporte.",
                {
                  title:
                    experience.title,
                }
              )
            : tx("La experiencia quedó certificada y añadida a tu historial."),

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
            tx("Seguir explorando"),
        },
      };

    default:
      return {
        title:
          "FEEL THE CITY",

        message:
          tx("Hospes está listo para acompañarte."),

        icon: "🧭",

        color:
          BRAND_COLOR,

        tone: "brand",
      };
  }
}
