import {
  Camera,
  MapPin,
  PartyPopper,
  Utensils,
} from "lucide-react";

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

import {
  useJourney,
} from "../context/JourneyContext";

import Hero from "./Hero";
import HospesBanner from "./hospes/HospesBanner";
import QuickActionsGrid from "./home/QuickActionsGrid";

import {
  Theme,
} from "../styles/theme";

import {
  tx,
} from "../i18n";

import type {
  Experience,
} from "../types/experience";

import pachamancaImage from "../assets/optimized/pachamanca.webp";
import cerritoImage from "../assets/optimized/cerrito-libertad.webp";
import santiagoImage from "../assets/optimized/fiesta-santiago.webp";

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

  const {
    startWalking,
  } = useJourney();

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

      weather:
        liveWeather,
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
            (
              visitedCount /
              totalExperiences
            ) * 100
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
      navigate(
        "/explorer"
      );

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
      "start-journey"
    ) {
      const experience =
        availableExperiences.find(
          (item) =>
            item.slug ===
              action.target ||
            item.experienceId ===
              action.target
        ) ??
        catalog.find(
          (item) =>
            item.slug ===
              action.target ||
            item.experienceId ===
              action.target
        );

      if (!experience) {
        navigate("/explorer");
        return;
      }

      const missionStarted =
        startWalking(
          experience
        );

      if (missionStarted) {
        navigate("/journey");
      }

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

    navigate(
      action.target
    );
  }

  const quickActions = [
    {
      id: "food",

      title:
        tx("¿Dónde puedo comer algo rico cerca?"),

      subtitle:
        tx("Restaurantes y cafés recomendados alrededor de ti"),

      icon:
        Utensils,

      tone:
        "magenta" as const,

      image:
        pachamancaImage,

      onClick: () =>
        navigate(
          "/mapa?nearby=food"
        ),
    },

    {
      id: "corners",

      title:
        tx("Descubrir rincones"),

      subtitle:
        tx("Miradores, historias y lugares ocultos"),

      icon:
        Camera,

      tone:
        "cyan" as const,

      image:
        cerritoImage,

      onClick: () =>
        openExperience(
          cornerExperience
        ),
    },

    {
      id: "surprise",

      title:
        tx("Sorpresa local"),

      subtitle:
        tx("Algo que Huancayo está viviendo hoy"),

      icon:
        PartyPopper,

      tone:
        "magenta" as const,

      image:
        santiagoImage,

      onClick: () =>
        openExperience(
          surpriseExperience
        ),
    },

    {
      id: "nearby",

      title:
        tx("Cerca de ti"),

      subtitle:
        tx("Descubre qué tienes alrededor"),

      icon:
        MapPin,

      tone:
        "cyan" as const,

      variant:
        "map" as const,

      onClick: () =>
        navigate(
          "/mapa"
        ),
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
          navigate(
            "/perfil"
          )
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
