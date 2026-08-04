import { useState } from "react";

import { getWeatherVisual } from "../engine/weatherEngine";
import { Theme } from "../styles/theme";

type Props = {
  temperature: number;

  weather: {
    condition:
      | "sunny"
      | "cloudy"
      | "rain"
      | "snow"
      | "drizzle";
  };
};

function WeatherCard({
  temperature,
  weather,
}: Props) {
  const [isHovered, setIsHovered] =
    useState(false);

  /*
   * Este ajuste es únicamente visual:
   *
   * sunny + día   → ☀️ Soleado
   * sunny + noche → 🌙 Despejado
   *
   * No modifica WeatherStatus ni el motor
   * contextual de Hospes.
   */
  const currentHour =
    new Date().getHours();

  const isNight =
    currentHour >= 18 ||
    currentHour < 6;

  const baseVisual =
    getWeatherVisual(
      weather.condition
    );

  const visual =
    weather.condition === "sunny" &&
    isNight
      ? {
          ...baseVisual,
          icon: "🌙",
          label: "Despejado",
        }
      : baseVisual;

  return (
    <div
      className="weather-card"
      onMouseEnter={() =>
        setIsHovered(true)
      }
      onMouseLeave={() =>
        setIsHovered(false)
      }
      style={{
        minWidth: "82px",

        textAlign: "right",
        left: "-10px",
        position: "relative",
        zIndex: 1,
        top: "-40px",
        cursor: "pointer",

        transformOrigin:
          "top right",

        transition:
          "transform 0.2s ease, text-shadow 0.2s ease",

        textShadow: isHovered
          ? "0 0 8px rgba(255,255,255,0.55)"
          : "none",

        transform: isHovered
          ? "scale(1.04)"
          : "scale(1)",
      }}
    >
      <h2
        style={{
          color:
            Theme.Colors.primary,

          margin: 0,

          fontSize: "1.7rem",
          lineHeight: 1,
        }}
      >
        {temperature}°
      </h2>

      <p
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent:
            "flex-end",

          gap: "7px",

          color: "#FFFFFF",

          margin: "5px 0 0",

          opacity: isHovered
            ? 1
            : 0.85,

          fontSize: "12px",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: "19px",
          }}
        >
          {visual.icon}
        </span>

        <span>
          {visual.label}
        </span>
      </p>
    </div>
  );
}

export default WeatherCard;