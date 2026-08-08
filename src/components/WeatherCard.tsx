import {
  Cloud,
  CloudDrizzle,
  CloudRain,
  Moon,
  Snowflake,
  Sun,
} from "lucide-react";

import {
  useState,
} from "react";

import NeonIcon from "./ui/NeonIcon";

import {
  tx,
} from "../i18n";

type WeatherCondition =
  | "sunny"
  | "cloudy"
  | "rain"
  | "snow"
  | "drizzle";

type Props = {
  temperature: number;

  weather: {
    condition:
      WeatherCondition;
  };
};

function getWeatherPresentation(
  condition: WeatherCondition,
  isNight: boolean
) {
  if (
    condition === "sunny" &&
    isNight
  ) {
    return {
      icon: Moon,
      label: "Despejado",
      tone:
        "cyan" as const,
    };
  }

  switch (condition) {
    case "sunny":
      return {
        icon: Sun,
        label: "Soleado",
        tone:
          "magenta" as const,
      };

    case "cloudy":
      return {
        icon: Cloud,
        label: "Nublado",
        tone:
          "cyan" as const,
      };

    case "rain":
      return {
        icon: CloudRain,
        label: "Lluvia",
        tone:
          "cyan" as const,
      };

    case "snow":
      return {
        icon: Snowflake,
        label: "Nieve",
        tone:
          "cyan" as const,
      };

    case "drizzle":
      return {
        icon: CloudDrizzle,
        label: "Llovizna",
        tone:
          "cyan" as const,
      };

    default:
      return {
        icon: Cloud,
        label: "Clima",
        tone:
          "cyan" as const,
      };
  }
}

function WeatherCard({
  temperature,
  weather,
}: Props) {
  const [
    isHovered,
    setIsHovered,
  ] = useState(false);

  const hour =
    new Date().getHours();

  const isNight =
    hour >= 18 ||
    hour < 6;

  const visual =
    getWeatherPresentation(
      weather.condition,
      isNight
    );

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
          color: "#FF00FF",

          margin: 0,

          fontSize: "1.7rem",
          lineHeight: 1,
        }}
      >
        {temperature}°
      </h2>

        <div
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
        <NeonIcon
          icon={visual.icon}
          tone={visual.tone}
          size={24}
          strokeWidth={1.55}
        />

        <span
          style={{
            color: "#FFFFFF",

            fontSize: "12px",

            fontWeight: 650,
          }}
        >
          {tx(visual.label)}
        </span>
      </div>
    </div>
  );
}

export default WeatherCard;
