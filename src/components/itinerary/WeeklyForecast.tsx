import {
  CloudRain,
} from "lucide-react";
import type {
  WeatherForecast,
  WeatherForecastDay,
} from "../../engine/weatherEngine";
import {
  getWeatherVisual,
} from "../../engine/weatherEngine";
import {
  getAppLanguage,
  tx,
} from "../../i18n";

type WeeklyForecastProps = {
  forecast: WeatherForecast | null;
  loading: boolean;
  hasError: boolean;
  selectedDate: string | null;
  onSelect: (
    day: WeatherForecastDay
  ) => void;
  onRetry: () => Promise<void>;
};

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

export function WeeklyForecast({
  forecast,
  loading,
  hasError,
  selectedDate,
  onSelect,
  onRetry,
}: WeeklyForecastProps) {
  return (
    <section
      aria-label={tx(
        "Pronóstico de 7 días"
      )}
      style={{
        borderRadius: "20px",
        padding: "15px",
        background:
          "rgba(57,231,255,0.045)",
        border:
          "1px solid rgba(57,231,255,0.14)",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CloudRain
            size={17}
            strokeWidth={2.2}
            color="#39E7FF"
          />
          <strong
            style={{
              color: "#FFFFFF",
              fontSize: "13px",
            }}
          >
            {tx("Pronóstico de 7 días")}
          </strong>
        </div>

        {forecast && (
          <span
            style={{
              color:
                "rgba(255,255,255,0.46)",
              fontSize: "10px",
            }}
          >
            {tx("Huancayo")}
          </span>
        )}
      </div>

      {loading && (
        <p
          style={{
            margin: 0,
            color:
              "rgba(255,255,255,0.66)",
            fontSize: "12px",
          }}
        >
          {tx("Consultando el clima...")}
        </p>
      )}

      {!loading && hasError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <p
            style={{
              margin: 0,
              color:
                "rgba(255,255,255,0.66)",
              fontSize: "12px",
            }}
          >
            {tx(
              "No pudimos cargar el pronóstico. El itinerario seguirá en modo conservador."
            )}
          </p>
          <button
            type="button"
            onClick={() => void onRetry()}
            style={{
              minHeight: "34px",
              padding: "0 11px",
              borderRadius: "10px",
              border:
                "1px solid rgba(57,231,255,0.28)",
              background:
                "rgba(57,231,255,0.08)",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            {tx("Reintentar")}
          </button>
        </div>
      )}

      {!loading && forecast && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "3px",
          }}
        >
          {forecast.days.map((day) => {
            const visual =
              getWeatherVisual(
                day.condition
              );
            const isSelected =
              day.date === selectedDate;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelect(day)}
                aria-pressed={isSelected}
                aria-label={`${formatForecastDate(
                  day.date
                )}: ${tx(
                  visual.label
                )}, ${day.temperatureMin}° a ${day.temperatureMax}°, ${day.precipitationProbability}% ${tx(
                  "de lluvia"
                )}`}
                style={{
                  minWidth: "104px",
                  padding: "10px 9px",
                  borderRadius: "15px",
                  border: isSelected
                    ? "1px solid rgba(255,0,200,0.62)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isSelected
                    ? "linear-gradient(160deg, rgba(255,0,200,0.22), rgba(181,0,255,0.15))"
                    : "rgba(255,255,255,0.035)",
                  color: "#FFFFFF",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    color:
                      "rgba(255,255,255,0.68)",
                    fontSize: "10px",
                    fontWeight: 750,
                    textTransform:
                      "capitalize",
                  }}
                >
                  {formatForecastDate(
                    day.date
                  )}
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "22px",
                  }}
                >
                  {visual.icon}
                </span>

                <strong
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "12px",
                  }}
                >
                  {day.temperatureMin}° /{" "}
                  {day.temperatureMax}°
                </strong>

                <span
                  style={{
                    display: "block",
                    color:
                      "rgba(57,231,255,0.86)",
                    fontSize: "10px",
                  }}
                >
                  {day.precipitationProbability}%{" "}
                  {tx("lluvia")}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
