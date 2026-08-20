import {
  Wind,
} from "lucide-react";
import {
  getWeatherVisual,
} from "../../engine/weatherEngine";
import {
  getAppLanguage,
  tx,
} from "../../i18n";
import type {
  ItineraryPlan,
  ItineraryReasonCode,
} from "../../types/itinerary";

type ItineraryPlanResultProps = {
  plan: ItineraryPlan;
  onStart: (slug: string) => void;
  onReplace: (index: number) => void;
};

function formatMinutes(
  totalMinutes: number
): string {
  const normalized =
    ((totalMinutes % (24 * 60)) +
      24 * 60) %
    (24 * 60);
  const hour = Math.floor(
    normalized / 60
  );
  const minute = normalized % 60;
  const period = hour >= 12 ? "pm" : "am";
  const displayHour =
    hour === 0
      ? 12
      : hour > 12
        ? hour - 12
        : hour;

  return `${displayHour}:${String(
    minute
  ).padStart(2, "0")} ${period}`;
}

function formatForecastDate(
  date: string
): string {
  const [year, month, day] =
    date.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12
  ).toLocaleDateString(
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE",
    {
      weekday: "short",
      day: "numeric",
    }
  );
}

function getReasonLabel(
  reasonCode: ItineraryReasonCode
): string {
  const labels: Record<
    ItineraryReasonCode,
    string
  > = {
    "interest-match":
      "Coincide con lo que quieres vivir",
    "weather-compatible":
      "Compatible con el pronóstico",
    "indoor-priority":
      "Prioridad bajo techo por lluvia",
    "weather-unknown-conservative":
      "Opción prudente mientras llega el pronóstico",
    "full-day-experience":
      "Actividad de jornada completa",
    "weather-wet-risk":
      "Excluido por lluvia o terreno sensible",
    "weather-unknown-risk":
      "Excluido hasta confirmar el clima",
    "high-mountain-weather":
      "Excluido por riesgo en alta montaña",
    "night-incompatible":
      "No es compatible con ese horario nocturno",
    "transport-incompatible":
      "No es viable con el transporte elegido",
    "outside-opening-hours":
      "Queda fuera del horario publicado",
    "full-day-conflict":
      "Necesita una jornada exclusiva",
    "not-enough-time":
      "No alcanza el tiempo disponible",
  };

  return tx(labels[reasonCode]);
}

function getHospesPlanMessage(
  plan: ItineraryPlan
): string {
  if (plan.stops.length === 0) {
    return tx(
      "No encontré una combinación segura para esa fecha y hora. Cambia el horario o revisa las exclusiones."
    );
  }

  if (plan.forecast === null) {
    return tx(
      "Aún no tengo pronóstico para esa fecha. Preparé una opción conservadora y dejé fuera los terrenos sensibles."
    );
  }

  const wetForecast =
    plan.forecast.condition === "rain" ||
    plan.forecast.condition === "drizzle" ||
    plan.forecast.condition === "snow" ||
    plan.forecast
      .precipitationProbability >= 40;

  if (wetForecast) {
    return tx(
      "He priorizado lugares bajo techo por el pronóstico de lluvia y mantuve visibles las opciones descartadas."
    );
  }

  if (
    plan.exclusions.some(
      (item) =>
        item.explanation.reasonCode ===
        "high-mountain-weather"
    )
  ) {
    return tx(
      "Organicé el día sin alta montaña porque el viento o las condiciones no son seguras."
    );
  }

  return tx(
    "Organicé el recorrido según tu interés, el tiempo disponible y el pronóstico de la fecha elegida."
  );
}

export function ItineraryPlanResult({
  plan,
  onStart,
  onReplace,
}: ItineraryPlanResultProps) {
  const weatherVisual =
    plan.forecast
      ? getWeatherVisual(
          plan.forecast.condition
        )
      : null;

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "20px",
      }}
    >
      <article
        role="status"
        style={{
          borderRadius: "18px",
          padding: "14px",
          background:
            "rgba(255,0,200,0.065)",
          border:
            "1px solid rgba(255,0,200,0.2)",
        }}
      >
        <strong
          style={{
            display: "block",
            marginBottom: "5px",
            color: "#FF65DC",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Hospes
        </strong>
        <p
          style={{
            margin: 0,
            color:
              "rgba(255,255,255,0.84)",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {getHospesPlanMessage(plan)}
        </p>
      </article>

      {plan.forecast && weatherVisual && (
        <article
          style={{
            display: "grid",
            gridTemplateColumns:
              "auto 1fr auto",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "16px",
            background:
              "rgba(57,231,255,0.045)",
            border:
              "1px solid rgba(57,231,255,0.13)",
          }}
        >
          <span
            aria-hidden="true"
            style={{ fontSize: "24px" }}
          >
            {weatherVisual.icon}
          </span>

          <div>
            <strong
              style={{
                display: "block",
                color: "#FFFFFF",
                fontSize: "12px",
              }}
            >
              {tx("Pronóstico usado")}: {" "}
              {formatForecastDate(
                plan.forecast.date
              )}
            </strong>
            <span
              style={{
                color:
                  "rgba(255,255,255,0.58)",
                fontSize: "10px",
              }}
            >
              {plan.forecast.temperatureMin}° /{" "}
              {plan.forecast.temperatureMax}° ·{" "}
              {plan.forecast
                .precipitationProbability}%{" "}
              {tx("lluvia")}
            </span>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color:
                "rgba(255,255,255,0.64)",
              fontSize: "10px",
            }}
          >
            <Wind
              size={13}
              aria-hidden="true"
            />
            {plan.forecast.windSpeedKmh} km/h
          </span>
        </article>
      )}

      {plan.forecast === null && (
        <p
          style={{
            margin: 0,
            padding: "10px 12px",
            borderRadius: "14px",
            background:
              "rgba(255,190,70,0.07)",
            border:
              "1px solid rgba(255,190,70,0.18)",
            color:
              "rgba(255,255,255,0.72)",
            fontSize: "11px",
            lineHeight: 1.45,
          }}
        >
          {tx(
            "Plan creado sin pronóstico: se aplicó la política conservadora."
          )}
        </p>
      )}

      {plan.stops.length === 0 && (
        <article
          style={{
            padding: "16px",
            borderRadius: "18px",
            background:
              "rgba(255,255,255,0.03)",
            border:
              "1px solid rgba(255,255,255,0.08)",
            color:
              "rgba(255,255,255,0.72)",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          {tx(
            "No hay paradas seguras y viables con esta combinación."
          )}
        </article>
      )}

      {plan.stops.map((stop, index) => {
        const experience =
          stop.experience;

        return (
          <article
            key={experience.experienceId}
            style={{
              borderRadius: "18px",
              padding: "14px",
              background:
                "rgba(255,255,255,0.03)",
              border:
                "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 3px",
                    color: "#39E7FF",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {formatMinutes(
                    stop.startMinutes
                  )}{" "}
                  –{" "}
                  {formatMinutes(
                    stop.endMinutes
                  )}
                </p>
                <strong
                  style={{
                    display: "block",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                >
                  {experience.title}
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: "4px",
                    color:
                      "rgba(255,255,255,0.48)",
                    fontSize: "10px",
                  }}
                >
                  {stop.travelMinutes} min{" "}
                  {tx("de traslado estimado")} ·{" "}
                  {stop.visitMinutes} min{" "}
                  {tx("de visita")}
                </span>
              </div>

              {stop.explanation.action ===
                "replaced" && (
                <span
                  style={{
                    flexShrink: 0,
                    padding: "5px 8px",
                    borderRadius: "999px",
                    background:
                      "rgba(255,0,200,0.12)",
                    color: "#FF83E2",
                    fontSize: "9px",
                    fontWeight: 800,
                  }}
                >
                  {tx("Reemplazo seguro")}
                </span>
              )}
            </div>

            <p
              style={{
                margin: "10px 0",
                padding: "7px 9px",
                borderRadius: "10px",
                background:
                  "rgba(57,231,255,0.06)",
                color:
                  "rgba(255,255,255,0.72)",
                fontSize: "10px",
                lineHeight: 1.35,
              }}
            >
              {getReasonLabel(
                stop.explanation.reasonCode
              )}
            </p>

            <div
              style={{
                display: "flex",
                gap: "6px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  onStart(experience.slug)
                }
                style={{
                  flex: 1,
                  minHeight: "36px",
                  padding: "0 12px",
                  border: "none",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, #FF00C8, #B500FF)",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {tx("Iniciar")}
              </button>

              <button
                type="button"
                onClick={() =>
                  onReplace(index)
                }
                style={{
                  flex: 1,
                  minHeight: "36px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(255,255,255,0.05)",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {tx("Reemplazar")}
              </button>
            </div>
          </article>
        );
      })}

      {plan.exclusions.length > 0 && (
        <details
          style={{
            borderRadius: "16px",
            padding: "12px 14px",
            background:
              "rgba(255,255,255,0.025)",
            border:
              "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <summary
            style={{
              color:
                "rgba(255,255,255,0.72)",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {tx("Opciones descartadas")} ({
              plan.exclusions.length
            })
          </summary>

          <ul
            style={{
              margin: "10px 0 0",
              paddingLeft: "18px",
              color:
                "rgba(255,255,255,0.58)",
              fontSize: "10px",
              lineHeight: 1.5,
            }}
          >
            {plan.exclusions.map((item) => (
              <li key={item.experienceId}>
                <strong
                  style={{
                    color:
                      "rgba(255,255,255,0.78)",
                  }}
                >
                  {item.title}
                </strong>
                :{" "}
                {getReasonLabel(
                  item.explanation.reasonCode
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
