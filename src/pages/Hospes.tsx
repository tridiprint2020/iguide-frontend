import { Link } from "react-router-dom";
import { Theme } from "../styles/theme";
import { loadUserProfile } from "../data/user";
import { useWeather } from "../context/WeatherContext";
import { getHospesMessage } from "../engine/hospesEngine";
import { tx } from "../i18n";
import { loadReturnPoint } from "../engine/returnPointEngine";

export default function Hospes() {
  const user = loadUserProfile();

  const {
    weather,
    isLoading,
    error,
    refreshWeather,
  } = useWeather();

  const returnPoint = loadReturnPoint();
  const conditionLabel = {
    sunny: tx("Soleado"),
    cloudy: tx("Nublado"),
    rain: tx("Lluvia"),
    drizzle: tx("Llovizna"),
    snow: tx("Nieve"),
  }[weather.condition] ?? weather.condition;
  const contextualMessage =
    isLoading || error !== null
      ? null
      : getHospesMessage(
          user,
          weather,
          returnPoint
            ? {
                latitude: returnPoint.lat,
                longitude: returnPoint.lng,
              }
            : undefined
        );

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: Theme.Space.xl,
      }}
    >
      <h1
        style={{
          color: Theme.Colors.primary,
          marginBottom: Theme.Space.sm,
        }}
      >
         Hospes
      </h1>

      <p
        style={{
          color: Theme.Colors.textSoft,
          marginBottom: Theme.Space.lg,
        }}
      >
        {tx("Aún estoy aprendiendo Huancayo.")}
      </p>

      <div
        style={{
          marginBottom: Theme.Space.md,
          color: Theme.Colors.textSoft,
          fontSize: "12px",
        }}
      >
        {isLoading
          ? `🌤️ ${tx("Consultando las condiciones reales de Huancayo…")}`
          : error !== null
            ? tx("No pude confirmar el clima actual.")
            : `🌤️ ${weather.temperature}° · ${conditionLabel} · ${weather.city}`}
      </div>

      {error !== null && (
        <button
          type="button"
          onClick={() => {
            void refreshWeather();
          }}
          style={{
            marginBottom: Theme.Space.md,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            padding: "8px 12px",
            background: "transparent",
            color: Theme.Colors.text,
            cursor: "pointer",
          }}
        >
          {tx("Reintentar clima real")}
        </button>
      )}

      <div
        style={{
          background: Theme.Colors.surface,
          borderRadius: Theme.Radius.large,
          padding: Theme.Space.lg,
          display: "flex",
          flexDirection: "column",
          gap: Theme.Space.md,
        }}
      >
        {contextualMessage && (
          <div
            style={{
              background: "#ffffff10",
              padding: "14px",
              borderRadius: Theme.Radius.medium,
            }}
          >
            {contextualMessage}
          </div>
        )}

        <p style={{ margin: 0, color: Theme.Colors.textSoft }}>
          {tx("Por ahora te oriento con las opciones del catálogo, la hora y el clima disponible. Las preguntas libres y las reservas todavía no están disponibles.")}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: Theme.Space.sm,
          }}
        >
          <Link
            to="/explorer"
            style={{
              padding: "14px 22px",
              borderRadius: Theme.Radius.medium,
              background: Theme.Colors.primary,
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {tx("Explorar catálogo")}
          </Link>

          <Link
            to="/itinerario"
            style={{
              padding: "14px 22px",
              border: "1px solid rgba(255,255,255,0.24)",
              borderRadius: Theme.Radius.medium,
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {tx("Armar un itinerario")}
          </Link>
        </div>
      </div>
    </div>
  );
}
