import type { WeatherStatus } from "../engine/weatherEngine";

/*
 * Respaldo local.
 *
 * Solo se usa mientras carga la API
 * o cuando no existe conexión.
 */
export const currentWeather: WeatherStatus = {
  temperature: 11,

  condition: "cloudy",

  city: "Huancayo",

  isHighMountainSafe: false,

  precipitationMm: 0,

  precipitationProbabilityNext3Hours: 55,

  windSpeedKmh: 0,
};
