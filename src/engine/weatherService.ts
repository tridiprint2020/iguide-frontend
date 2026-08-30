import type {
  WeatherForecast,
  WeatherForecastDay,
  WeatherStatus,
} from "./weatherEngine";

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
    precipitation_probability?: number[];
    temperature_2m?: number[];
    weather_code?: number[];
    apparent_temperature?: number[];
    wind_speed_10m?: number[];
  };

  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    uv_index_max?: number[];
    sunrise?: string[];
    sunset?: string[];
    daylight_duration?: number[];
    precipitation_hours?: number[];
  };

  timezone?: string;
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

const OPEN_METEO_FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast";

const FORECAST_DAYS = 7;

const FORECAST_CACHE_TTL_MS =
  3 * 60 * 60 * 1000;

let forecastCache:
  | {
      expiresAt: number;
      value: WeatherForecast;
    }
  | null = null;

let forecastRequest:
  Promise<WeatherForecast> | null = null;

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

function getRequiredDailyValue(
  values: number[] | undefined,
  index: number,
  field: string
): number {
  const value = values?.[index];

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `Open-Meteo no devolvió ${field} para el día solicitado.`
    );
  }

  return value;
}

function getRequiredHourlyValue(
  values: number[] | undefined,
  index: number,
  field: string,
  date: string,
  hour: number
): number {
  const value = values?.[index];

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `Open-Meteo no devolvió ${field} para ${date} a las ${hour}:00.`
    );
  }

  return value;
}

function getOptionalNumber(
  values: number[] | undefined,
  index: number
): number | undefined {
  const value = values?.[index];

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function getOptionalString(
  values: string[] | undefined,
  index: number
): string | undefined {
  const value = values?.[index];

  return typeof value === "string" &&
    value.length > 0
    ? value
    : undefined;
}

function getForecastPeriod(
  data: OpenMeteoResponse,
  date: string,
  hour: number
) {
  const expectedTime =
    `${date}T${String(hour).padStart(2, "0")}:00`;
  const times = data.hourly?.time ?? [];
  const index = times.indexOf(expectedTime);

  if (index < 0) {
    throw new Error(
      `Open-Meteo no devolvió el tramo ${expectedTime}.`
    );
  }

  const temperature =
    getRequiredHourlyValue(
      data.hourly?.temperature_2m,
      index,
      "temperature_2m",
      date,
      hour
    );
  const weatherCode =
    getRequiredHourlyValue(
      data.hourly?.weather_code,
      index,
      "weather_code",
      date,
      hour
    );
  const apparentTemperature =
    getOptionalNumber(
      data.hourly?.apparent_temperature,
      index
    );
  const precipitationProbability =
    getOptionalNumber(
      data.hourly?.precipitation_probability,
      index
    );
  const windSpeedKmh = getOptionalNumber(
    data.hourly?.wind_speed_10m,
    index
  );

  return {
    hour,
    temperature: Math.round(temperature),
    condition: mapWeatherCode(weatherCode),
    ...(apparentTemperature !== undefined
      ? {
          apparentTemperature: Math.round(
            apparentTemperature
          ),
        }
      : {}),
    ...(precipitationProbability !== undefined
      ? {
          precipitationProbability: Math.round(
            precipitationProbability
          ),
        }
      : {}),
    ...(windSpeedKmh !== undefined
      ? {
          windSpeedKmh: Math.round(
            windSpeedKmh
          ),
        }
      : {}),
  };
}

function mapDailyForecast(
  data: OpenMeteoResponse,
  fetchedAt: number
): WeatherForecast {
  const daily = data.daily;
  const dates = daily?.time ?? [];

  if (!daily || dates.length === 0) {
    throw new Error(
      "Open-Meteo no devolvió el pronóstico diario."
    );
  }

  const days =
    dates
      .slice(0, FORECAST_DAYS)
      .map(
        (
          date,
          index
        ): WeatherForecastDay => {
          const weatherCode =
            getRequiredDailyValue(
              daily.weather_code,
              index,
              "weather_code"
            );

          const temperatureMin =
            getRequiredDailyValue(
              daily.temperature_2m_min,
              index,
              "temperature_2m_min"
            );

          const temperatureMax =
            getRequiredDailyValue(
              daily.temperature_2m_max,
              index,
              "temperature_2m_max"
            );

          const precipitationProbability =
            getRequiredDailyValue(
              daily.precipitation_probability_max,
              index,
              "precipitation_probability_max"
            );

          const windSpeedKmh =
            getRequiredDailyValue(
              daily.wind_speed_10m_max,
              index,
              "wind_speed_10m_max"
            );

          const condition =
            mapWeatherCode(weatherCode);
          const uvIndexMax = getOptionalNumber(
            daily.uv_index_max,
            index
          );
          const sunrise = getOptionalString(
            daily.sunrise,
            index
          );
          const sunset = getOptionalString(
            daily.sunset,
            index
          );
          const daylightDurationSeconds =
            getOptionalNumber(
              daily.daylight_duration,
              index
            );
          const precipitationHours =
            getOptionalNumber(
              daily.precipitation_hours,
              index
            );

          const isHighMountainSafe =
            (condition === "sunny" ||
              condition === "cloudy") &&
            precipitationProbability < 40 &&
            windSpeedKmh < 35;

          return {
            date,
            city: "Huancayo",
            condition,
            temperatureMin:
              Math.round(temperatureMin),
            temperatureMax:
              Math.round(temperatureMax),
            precipitationProbability:
              Math.round(
                precipitationProbability
              ),
            windSpeedKmh:
              Math.round(windSpeedKmh),
            isHighMountainSafe,
            ...(uvIndexMax !== undefined
              ? { uvIndexMax }
              : {}),
            ...(sunrise ? { sunrise } : {}),
            ...(sunset ? { sunset } : {}),
            ...(daylightDurationSeconds !==
            undefined
              ? { daylightDurationSeconds }
              : {}),
            ...(precipitationHours !== undefined
              ? { precipitationHours }
              : {}),
            periods: {
              morning: getForecastPeriod(
                data,
                date,
                9
              ),
              afternoon: getForecastPeriod(
                data,
                date,
                15
              ),
              night: getForecastPeriod(
                data,
                date,
                21
              ),
            },
          };
        }
      );

  return {
    city: "Huancayo",
    timezone:
      data.timezone ?? "America/Lima",
    fetchedAt,
    days,
  };
}

async function requestSevenDayForecast(): Promise<WeatherForecast> {
  const parameters =
    new URLSearchParams({
      latitude: String(
        HUANCAYO_COORDINATES.latitude
      ),

      longitude: String(
        HUANCAYO_COORDINATES.longitude
      ),

      daily: [
        "weather_code",
        "temperature_2m_min",
        "temperature_2m_max",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "uv_index_max",
        "sunrise",
        "sunset",
        "daylight_duration",
        "precipitation_hours",
      ].join(","),

      hourly: [
        "temperature_2m",
        "weather_code",
        "apparent_temperature",
        "precipitation_probability",
        "wind_speed_10m",
      ].join(","),

      forecast_days: String(
        FORECAST_DAYS
      ),

      timezone:
        "America/Lima",

      wind_speed_unit:
        "kmh",
    });

  const response =
    await fetch(
      `${OPEN_METEO_FORECAST_URL}?${parameters.toString()}`
    );

  if (!response.ok) {
    throw new Error(
      `Open-Meteo respondió con estado ${response.status}.`
    );
  }

  const data =
    (await response.json()) as OpenMeteoResponse;

  return mapDailyForecast(
    data,
    Date.now()
  );
}

export async function fetchSevenDayForecast(
  options?: {
    forceRefresh?: boolean;
  }
): Promise<WeatherForecast> {
  const now = Date.now();

  if (
    !options?.forceRefresh &&
    forecastCache &&
    forecastCache.expiresAt > now
  ) {
    return forecastCache.value;
  }

  if (
    !options?.forceRefresh &&
    forecastRequest
  ) {
    return forecastRequest;
  }

  const request =
    requestSevenDayForecast()
      .then((forecast) => {
        forecastCache = {
          value: forecast,
          expiresAt:
            forecast.fetchedAt +
            FORECAST_CACHE_TTL_MS,
        };

        return forecast;
      })
      .finally(() => {
        if (forecastRequest === request) {
          forecastRequest = null;
        }
      });

  forecastRequest = request;

  return request;
}

export async function getForecastForDate(
  date: string
): Promise<WeatherForecastDay | null> {
  const forecast =
    await fetchSevenDayForecast();

  return (
    forecast.days.find(
      (day) =>
        day.date === date
    ) ?? null
  );
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
      `${OPEN_METEO_FORECAST_URL}?${parameters.toString()}`
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
