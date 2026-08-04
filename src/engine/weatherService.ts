import type { WeatherStatus } from "./weatherEngine";

type OpenMeteoCurrent = {
  temperature_2m: number;

  precipitation: number;

  rain: number;

  weather_code: number;

  wind_speed_10m: number;

  /*
   * La API puede devolverlo,
   * pero no forma parte de WeatherStatus.
   */
  is_day?: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
};

const HUANCAYO_COORDINATES = {
  latitude: -12.06513,
  longitude: -75.20486,
};

function mapWeatherCode(
  code: number
): WeatherStatus["condition"] {
  if (
    code === 0 ||
    code === 1
  ) {
    return "sunny";
  }

  if (
    code === 2 ||
    code === 3 ||
    code === 45 ||
    code === 48
  ) {
    return "cloudy";
  }

  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 56 ||
    code === 57
  ) {
    return "drizzle";
  }

  if (
    (code >= 61 &&
      code <= 67) ||
    (code >= 80 &&
      code <= 82) ||
    code === 95 ||
    code === 96 ||
    code === 99
  ) {
    return "rain";
  }

  if (
    (code >= 71 &&
      code <= 77) ||
    code === 85 ||
    code === 86
  ) {
    return "snow";
  }

  return "cloudy";
}

export async function fetchCurrentWeather(): Promise<WeatherStatus> {
  const parameters =
    new URLSearchParams({
      latitude: String(
        HUANCAYO_COORDINATES.latitude
      ),

      longitude: String(
        HUANCAYO_COORDINATES.longitude
      ),

      current: [
        "temperature_2m",
        "precipitation",
        "rain",
        "weather_code",
        "wind_speed_10m",
        "is_day",
      ].join(","),

      timezone:
        "America/Lima",
    });

  const response =
    await fetch(
      `https://api.open-meteo.com/v1/forecast?${parameters.toString()}`
    );

  if (!response.ok) {
    throw new Error(
      `Open-Meteo respondió con estado ${response.status}.`
    );
  }

  const data =
    (await response.json()) as OpenMeteoResponse;

  if (!data.current) {
    throw new Error(
      "Open-Meteo no devolvió las condiciones meteorológicas actuales."
    );
  }

  const condition =
    mapWeatherCode(
      data.current.weather_code
    );

  return {
    temperature:
      Math.round(
        data.current
          .temperature_2m
      ),

    condition,

    city: "Huancayo",

    isHighMountainSafe:
      condition === "sunny" ||
      condition === "cloudy",
  };
}