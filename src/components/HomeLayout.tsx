import {
  useNavigate,
} from "react-router-dom";

import {
  catalog,
} from "../data/catalog";

import {
  loadUserProfile,
} from "../data/user";

import {
  getRecommendations,
} from "../engine/recommendationEngine";

import {
  getHospesMessage,
} from "../engine/hospesContextEngine";

import {
  selectHomeExperience,
} from "../engine/homeRecommendationEngine";

import {
  useWeather,
} from "../context/WeatherContext";

import Hero from "./Hero";

import HospesBanner from "./hospes/HospesBanner";

import QuickActionsGrid from "./home/QuickActionsGrid";

import {
  Theme,
} from "../styles/theme";

import type {
  Experience,
} from "../types/experience";

import pachamancaImage from "../assets/placeholders/pachamanca.webp";
import cerritoImage from "../assets/placeholders/cerrito-libertad.webp";
import santiagoImage from "../assets/placeholders/fiesta-santiago.webp";


function getSearchableText(
  experience: Experience
): string {
  return [
    experience.title,
    experience.description,
    experience.type,
    ...(experience.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function findFoodExperience(
  experiences: Experience[]
): Experience | null {
  return (
    experiences.find(
      (experience) =>
        experience.type ===
          "restaurant" ||
        experience.type ===
          "cafe"
    ) ?? null
  );
}

function findCornerExperience(
  experiences: Experience[]
): Experience | null {
  const preferred =
    experiences.find(
      (experience) => {
        const text =
          getSearchableText(
            experience
          );

        return (
          experience.type ===
            "expedition" &&
          [
            "mirador",
            "fotografía",
            "fotografia",
            "oculto",
            "rincón",
            "rincon",
            "cerrito",
            "torre torre",
          ].some((term) =>
            text.includes(term)
          )
        );
      }
    );

  return (
    preferred ??
    experiences.find(
      (experience) =>
        experience.type ===
        "expedition"
    ) ??
    null
  );
}

function findSurpriseExperience(
  experiences: Experience[]
): Experience | null {
  const festival =
    experiences.find(
      (experience) =>
        experience.type ===
        "festival"
    );

  if (festival) {
    return festival;
  }

  return (
    experiences.find(
      (experience) => {
        const text =
          getSearchableText(
            experience
          );

        return [
          "evento",
          "fiesta",
          "feria",
          "tradición",
          "tradicion",
          "patronal",
          "local",
        ].some((term) =>
          text.includes(term)
        );
      }
    ) ?? null
  );
}

function HomeLayout() {
  const navigate =
    useNavigate();

  const profile =
    loadUserProfile();

  const {
    weather: liveWeather,
    isLoading: weatherLoading,
  } = useWeather();

  const recommendations =
    getRecommendations({
      profile,
    });

  const availableExperiences =
    recommendations.length > 0
      ? recommendations
      : catalog;

  const suggestedExperience =
    selectHomeExperience({
      experiences:
        availableExperiences,

      weather: liveWeather,
    });

  const hospesMessage =
    getHospesMessage({
      screen: "home",

      userName:
        profile.name,

      weather:
        liveWeather,

      suggestedExperience,
    });

  const foodExperience =
    findFoodExperience(
      availableExperiences
    ) ??
    findFoodExperience(
      catalog
    );

  const cornerExperience =
    findCornerExperience(
      availableExperiences
    ) ??
    findCornerExperience(
      catalog
    );

  const surpriseExperience =
    findSurpriseExperience(
      availableExperiences
    ) ??
    findSurpriseExperience(
      catalog
    );

  const totalExperiences =
    catalog.filter(
      (experience) =>
        experience.isActive !==
        false
    ).length;

  const visitedCount =
    new Set(
      profile.visitedExperiences
    ).size;

  const progressPercent =
    totalExperiences > 0
      ? Math.min(
          100,
          Math.round(
            (visitedCount /
              totalExperiences) *
              100
          )
        )
      : 0;

  const currentLevelXp =
    profile.experience % 300;

  const xpToNextLevel =
    currentLevelXp === 0 &&
    profile.experience > 0
      ? 300
      : 300 -
        currentLevelXp;

  function openExperience(
    experience:
      | Experience
      | null
  ) {
    if (!experience) {
      navigate("/explorer");
      return;
    }

    navigate(
      `/expedition/${experience.slug}`
    );
  }

  function handleHospesAction() {
    const action =
      hospesMessage.action;

    if (!action) {
      return;
    }

    if (
      action.type ===
      "open-experience"
    ) {
      navigate(
        `/expedition/${action.target}`
      );

      return;
    }

    navigate(action.target);
  }

  const quickActions = [
   {
  id: "food",
  title: "Comer increíble",
  subtitle: "Sabores que los locales recomiendan",
  icon: "🍽️",
  image: pachamancaImage,
  accent: "#FF00FF",
  onClick: () =>
    openExperience(foodExperience),
},
{
  id: "corners",
  title: "Descubrir rincones",
  subtitle: "Miradores, historias y lugares ocultos",
  icon: "📷",
  image: cerritoImage,
  accent: "#FF00FF",
  onClick: () =>
    openExperience(cornerExperience),
},
{
  id: "surprise",
  title: "Sorpresa local",
  subtitle: "Algo que Huancayo está viviendo hoy",
  icon: "🎉",
  image: santiagoImage,
  accent: "#FF8A00",
  onClick: () =>
    openExperience(surpriseExperience),
},
    {
      id: "nearby",

      title:
        "Cerca de ti",

      subtitle:
        "Abre el mapa y descubre qué tienes alrededor",

      icon: "📍",

      accent:
        "#FF00FF",

      variant:
        "map" as const,

      onClick: () =>
        navigate("/mapa"),
    },
  ];

  return (
    <div
      style={{
        display: "flex",

        flexDirection:
          "column",

        gap: "12px",

        width: "100%",

        minWidth: 0,

        paddingBottom:
          Theme.Space.xl,
      }}
    >
      <Hero
        weather={
          liveWeather
        }
        isWeatherLoading={
          weatherLoading
        }
      />

      <HospesBanner
        message={
          hospesMessage
        }
        onAction={
          handleHospesAction
        }
        progress={{
          level:
            profile.level,

          xp:
            profile.experience,

          xpToNextLevel,

          progressPercent,

          visitedCount,

          totalCount:
            totalExperiences,
        }}
        onProgressClick={() =>
          navigate("/perfil")
        }
      />

      <QuickActionsGrid
        actions={
          quickActions
        }
      />
    </div>
  );
}

export default HomeLayout;