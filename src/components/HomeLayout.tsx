import { useNavigate } from "react-router-dom";

import { catalog } from "../data/catalog";
import { loadUserProfile } from "../data/user";

import { getRecommendations } from "../engine/recommendationEngine";
import { getHospesMessage } from "../engine/hospesContextEngine";
import { selectHomeExperience } from "../engine/homeRecommendationEngine";

import { useWeather } from "../context/WeatherContext";

import Hero from "./Hero";
import HospesBanner from "./hospes/HospesBanner";
import MoodCarousel from "./MoodCarousel";
import PlaceHighlightCard from "./PlaceHighlightCard";

import { Theme } from "../styles/theme";

function HomeLayout() {
  const navigate = useNavigate();

  const profile = loadUserProfile();

  /*
   * ÚNICA FUENTE METEOROLÓGICA:
   * WeatherProvider consulta la API y comparte
   * el mismo clima con toda la aplicación.
   */
  const {
    weather: liveWeather,
    isLoading: weatherLoading,
  } = useWeather();

  const recommendations =
    getRecommendations({
      profile,
    });

  /*
   * Hospes no toma automáticamente el primer
   * resultado. El motor filtra según hora y clima.
   */
  const suggestedExperience =
    selectHomeExperience({
      experiences:
        recommendations.length > 0
          ? recommendations
          : catalog,
      weather: liveWeather,
    });

  const hospesMessage =
    getHospesMessage({
      screen: "home",
      userName: profile.name,
      weather: liveWeather,
      suggestedExperience,
    });

  const highlights =
    recommendations.length > 0
      ? recommendations.slice(0, 4)
      : catalog.slice(0, 4);

  function handleHospesAction() {
    const action = hospesMessage.action;

    if (!action) {
      return;
    }

    if (action.type === "open-experience") {
      navigate(
        `/expedition/${action.target}`
      );

      return;
    }

    navigate(action.target);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: Theme.Space.lg,
        width: "100%",
        minWidth: 0,
      }}
    >
      <Hero
        weather={liveWeather}
        isWeatherLoading={
          weatherLoading
        }
      />

      <HospesBanner
        message={hospesMessage}
        onAction={
          handleHospesAction
        }
      />

      <MoodCarousel />

      <section>
        <h2
          style={{
            color: Theme.Colors.text,
            fontSize: "20px",
            marginBottom: "14px",
          }}
        >
          Seleccionado para ti
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-start",
            width: "100%",
            paddingLeft: "8px",
            margin: 0,
            boxSizing: "border-box",
            gap: "16px",
            overflowX: "auto",
          }}
        >
          {highlights.map(
            (experience) => (
              <div
                key={
                  experience.experienceId
                }
                style={{
                  minWidth: "260px",
                }}
              >
                <PlaceHighlightCard
                  expedition={
                    experience
                  }
                />
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default HomeLayout;