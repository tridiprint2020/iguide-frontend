import type { WeatherStatus } from "./weatherEngine";

type OpenMeteoCurrent = {
  time: string;

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

  hourly?: {
    time: string[];
    precipitation_probability: number[];
  };
};

function getUpcomingRainProbability(
  data: OpenMeteoResponse
): number {
  const times = data.hourly?.time ?? [];
  const probabilities =
    data.hourly?.precipitation_probability ?? [];
  const currentTime = data.current?.time;

  if (!currentTime || times.length === 0) {
    return 0;
  }

  const currentHour = currentTime.slice(0, 13);
  const startIndex = times.findIndex(
    (time) => time.slice(0, 13) >= currentHour
  );

  if (startIndex < 0) {
    return 0;
  }

  return Math.max(
    0,
    ...probabilities.slice(startIndex, startIndex + 3)
  );
}

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

      hourly: "precipitation_probability",

      forecast_days: "2",

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

  const precipitationProbabilityNext3Hours =
    getUpcomingRainProbability(data);

  const hasNearRainRisk =
    precipitationProbabilityNext3Hours >= 40 ||
    data.current.precipitation > 0 ||
    data.current.rain > 0;

  return {
    temperature:
      Math.round(
        data.current
          .temperature_2m
      ),

    condition,

    city: "Huancayo",

    isHighMountainSafe:
      (condition === "sunny" || condition === "cloudy") &&
      !hasNearRainRisk &&
      data.current.wind_speed_10m < 35,

    precipitationMm:
      data.current.precipitation,

    precipitationProbabilityNext3Hours,

    windSpeedKmh:
      data.current.wind_speed_10m,
  };
}
