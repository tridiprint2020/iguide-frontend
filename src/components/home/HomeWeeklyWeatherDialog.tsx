import {
  useEffect,
  useState,
} from "react";
import {
  createPortal,
} from "react-dom";
import {
  CalendarDays,
  X,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";

import {
  getWeatherVisual,
} from "../../engine/weatherEngine";
import type {
  WeatherForecast,
  WeatherForecastDay,
} from "../../engine/weatherEngine";
import {
  fetchSevenDayForecast,
} from "../../engine/weatherService";
import {
  getAppLanguage,
  tx,
} from "../../i18n";

type Props = {
  onClose: () => void;
};

const PERIODS = [
  {
    id: "morning" as const,
    label: "Mañana",
  },
  {
    id: "afternoon" as const,
    label: "Tarde",
  },
  {
    id: "night" as const,
    label: "Noche",
  },
];

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
      month: "short",
    }
  );
}

function ForecastDayCard({
  day,
  onSelectPeriod,
}: {
  day: WeatherForecastDay;
  onSelectPeriod: (
    date: string,
    hour: number
  ) => void;
}) {
  if (!day.periods) {
    return null;
  }

  const periods = day.periods;

  return (
    <article
      style={{
        minWidth: "132px",
        padding: "12px 10px",
        borderRadius: "17px",
        border:
          "1px solid rgba(255,255,255,0.09)",
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
      }}
    >
      <strong
        style={{
          display: "block",
          marginBottom: "9px",
          color: "#FFFFFF",
          fontSize: "11px",
          textTransform: "capitalize",
        }}
      >
        {formatForecastDate(day.date)}
      </strong>

      <div
        style={{
          display: "grid",
          gap: "7px",
        }}
      >
        {PERIODS.map((period) => {
          const forecastPeriod =
            periods[period.id];
          const visual = getWeatherVisual(
            forecastPeriod.condition
          );

          return (
            <button
              key={period.id}
              type="button"
              onClick={() =>
                onSelectPeriod(
                  day.date,
                  forecastPeriod.hour === 21
                    ? 19
                    : forecastPeriod.hour
                )
              }
              aria-label={`${tx(period.label)}: ${tx(
                visual.label
              )}, ${forecastPeriod.temperature}°. ${tx(
                "Preparar esta franja en el itinerario"
              )}`}
              style={{
                width: "100%",
                minHeight: "42px",
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) auto",
                alignItems: "center",
                gap: "6px",
                padding: "6px 7px",
                borderRadius: "11px",
                border:
                  "1px solid rgba(66,232,245,0.08)",
                background:
                  "rgba(4,6,15,0.48)",
                font: "inherit",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span>
                <span
                  style={{
                    display: "block",
                    color:
                      "rgba(255,255,255,0.52)",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {tx(period.label)}
                </span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "2px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                >
                  {forecastPeriod.temperature}°
                </strong>
              </span>

              <span
                aria-hidden="true"
                title={tx(visual.label)}
                style={{
                  fontSize: "21px",
                  lineHeight: 1,
                }}
              >
                {visual.icon}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default function HomeWeeklyWeatherDialog({
  onClose,
}: Props) {
  const navigate = useNavigate();
  const [forecast, setForecast] =
    useState<WeatherForecast | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [hasError, setHasError] =
    useState(false);

  useEffect(() => {
    let active = true;

    void fetchSevenDayForecast()
      .then((nextForecast) => {
        if (active) {
          setForecast(nextForecast);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  async function handleRetry() {
    setLoading(true);
    setHasError(false);

    try {
      setForecast(
        await fetchSevenDayForecast({
          forceRefresh: true,
        })
      );
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-weather-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 140000,
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        padding:
          "max(16px, env(safe-area-inset-top)) 12px max(20px, env(safe-area-inset-bottom))",
        overflowY: "auto",
        background: "rgba(2,3,10,0.86)",
        backdropFilter: "blur(14px)",
      }}
    >
      <section
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(100%, 1040px)",
          maxHeight: "min(88vh, 720px)",
          overflow: "hidden",
          borderRadius: "24px",
          border:
            "1px solid rgba(66,232,245,0.24)",
          background:
            "radial-gradient(circle at 90% 5%, rgba(66,232,245,0.13), transparent 28%), radial-gradient(circle at 8% 95%, rgba(255,61,232,0.13), transparent 28%), #0D0F19",
          boxShadow:
            "0 28px 90px rgba(0,0,0,0.68)",
          color: "#FFFFFF",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            padding: "17px 17px 12px",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#42E8F5",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <CalendarDays size={14} />
              {tx("Huancayo esta semana")}
            </span>
            <h2
              id="home-weather-title"
              style={{
                margin: "6px 0 0",
                fontSize: "clamp(19px, 4vw, 28px)",
                lineHeight: 1.08,
              }}
            >
              {tx("Clima de mañana, tarde y noche")}
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                color:
                  "rgba(255,255,255,0.58)",
                fontSize: "10px",
              }}
            >
              {tx(
                "Toca una franja para preparar ese momento en tu itinerario."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={tx("Cerrar")}
            style={{
              width: "38px",
              height: "38px",
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              border:
                "1px solid rgba(255,255,255,0.13)",
              background:
                "rgba(255,255,255,0.055)",
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            <X size={19} />
          </button>
        </header>

        <div
          aria-live="polite"
          aria-busy={loading}
          style={{
            maxHeight: "calc(min(88vh, 720px) - 106px)",
            overflowY: "auto",
            padding: "3px 17px 18px",
          }}
        >
          {loading && !forecast && (
            <p
              style={{
                margin: "18px 0",
                color:
                  "rgba(255,255,255,0.68)",
                fontSize: "12px",
              }}
            >
              {tx("Consultando el clima...")}
            </p>
          )}

          {!loading && hasError && !forecast && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                margin: "12px 0 18px",
              }}
            >
              <p
                role="alert"
                style={{
                  margin: 0,
                  color:
                    "rgba(255,255,255,0.70)",
                  fontSize: "12px",
                }}
              >
                {tx(
                  "No pudimos cargar el pronóstico semanal."
                )}
              </p>
              <button
                type="button"
                onClick={() =>
                  void handleRetry()
                }
                style={{
                  minHeight: "38px",
                  padding: "0 13px",
                  borderRadius: "11px",
                  border:
                    "1px solid rgba(66,232,245,0.28)",
                  background:
                    "rgba(66,232,245,0.08)",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {tx("Reintentar")}
              </button>
            </div>
          )}

          {forecast && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(7, minmax(132px, 1fr))",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "6px",
              }}
            >
              {forecast.days.map((day) => (
                <ForecastDayCard
                  key={day.date}
                  day={day}
                  onSelectPeriod={(
                    date,
                    hour
                  ) => {
                    const parameters =
                      new URLSearchParams({
                        date,
                        hour: String(hour),
                        source: "weather",
                      });

                    onClose();
                    navigate(
                      `/itinerario?${parameters.toString()}`
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </section>
    </div>,
    document.body
  );
}
