import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { currentWeather as fallbackWeather } from "../data/currentWeather";
import { fetchCurrentWeather } from "../engine/weatherService";

import type { WeatherStatus } from "../engine/weatherEngine";

type WeatherContextValue = {
  weather: WeatherStatus;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
};

const WeatherContext =
  createContext<WeatherContextValue | undefined>(
    undefined
  );

export function WeatherProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [weather, setWeather] =
    useState<WeatherStatus>(
      fallbackWeather
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function refreshWeather(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const liveWeather =
        await fetchCurrentWeather();

      setWeather(liveWeather);

      console.info(
        "🌤️ Clima real I.GUIDE:",
        liveWeather
      );
    } catch (weatherError) {
      const message =
        weatherError instanceof Error
          ? weatherError.message
          : "No se pudo consultar el clima.";

      console.warn(
        "Hospes utilizará el clima de respaldo:",
        weatherError
      );

      setError(message);
      setWeather(fallbackWeather);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshWeather();

    /*
     * Actualiza el clima cada 15 minutos.
     * No consulta la API en cada render.
     */
    const refreshInterval =
      window.setInterval(
        () => {
          void refreshWeather();
        },
        15 * 60 * 1000
      );

    return () => {
      window.clearInterval(
        refreshInterval
      );
    };
  }, []);

  return (
    <WeatherContext.Provider
      value={{
        weather,
        isLoading,
        error,
        refreshWeather,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context =
    useContext(WeatherContext);

  if (!context) {
    throw new Error(
      "useWeather debe utilizarse dentro de WeatherProvider."
    );
  }

  return context;
}