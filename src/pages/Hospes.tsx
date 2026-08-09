import { useState } from "react";
import { Theme } from "../styles/theme";
import { loadUserProfile } from "../data/user";
import { useWeather } from "../context/WeatherContext";
import { getHospesMessage } from "../engine/hospesEngine";
import { tx } from "../i18n";

export default function Hospes() {
  const user = loadUserProfile();

  const {
    weather,
    isLoading,
    error,
    refreshWeather,
  } = useWeather();

  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const conditionLabel = {
    sunny: tx("Soleado"),
    cloudy: tx("Nublado"),
    rain: tx("Lluvia"),
    drizzle: tx("Llovizna"),
    snow: tx("Nieve"),
  }[weather.condition] ?? weather.condition;
  const contextualMessage =
    isLoading
      ? null
      : getHospesMessage(
          user,
          weather
        );

  function sendMessage() {
    if (!input.trim()) return;

    setMessages((old) => [
      ...old,
      `👤 ${input}`,
      `🎩 ${tx("Estoy analizando la mejor opción para ti. Muy pronto podré recomendarte rutas, reservar restaurantes y organizar todo tu itinerario.")}`,
    ]);

    setInput("");
  }

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
        {tx("Listo para ayudarte, hoy tengo esto para ti.")}
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
          : `🌤️ ${weather.temperature}° · ${conditionLabel} · ${weather.city}`}
      </div>

      {error && (
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
          minHeight: "420px",
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

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              background: "#ffffff10",
              padding: "14px",
              borderRadius: Theme.Radius.medium,
            }}
          >
            {msg}
          </div>
        ))}

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: Theme.Space.sm,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tx("Escribe a Hospes...")}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: Theme.Radius.medium,
              border: "none",
              outline: "none",
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              padding: "14px 22px",
              border: "none",
              cursor: "pointer",
              borderRadius: Theme.Radius.medium,
              background: Theme.Colors.primary,
              color: "white",
              fontWeight: 600,
            }}
          >
            {tx("Enviar")}
          </button>
        </div>
      </div>
    </div>
  );
}
