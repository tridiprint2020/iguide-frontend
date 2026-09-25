import { useEffect, useState } from "react";
import { getCategorySlides } from "./home/categorySlides";
import { isVerifiedHuarique } from "../engine/huariqueEngine";
import { getHaversineDistanceKm } from "../engine/itineraryTravelEngine";


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
  loadReturnPoint,
} from "../engine/returnPointEngine";

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

import papaHuancainaImage from "../assets/optimized/papa-huancaina.webp";
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

  const returnPoint =
    loadReturnPoint();
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    let active = true;
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => { if (active) setPosition({ latitude: coords.latitude, longitude: coords.longitude }); },
      () => {}, { maximumAge: 60000, timeout: 8000, enableHighAccuracy: true }
    );
    return () => { active = false; };
  }, []);
  const origin = position ?? (returnPoint ? { latitude: returnPoint.lat, longitude: returnPoint.lng } : null);


  const recommendations =
    getRecommendations(
      {
        profile,
        location: origin ?? undefined,
      },
      {
        weather: liveWeather,
      }
    );

  /* El motor compartido ya aplicó intención, horario y seguridad. */
  const availableExperiences =
    recommendations;

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
    );

  const surpriseExperience =
    findSurpriseExperience(
      availableExperiences
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

  const readyIds = new Set(availableExperiences.map((item) => item.experienceId));
  const category = (matches: (item: Experience) => boolean) =>
    getCategorySlides(catalog, readyIds, matches).sort((a, b) => origin
      ? getHaversineDistanceKm(origin, a) - getHaversineDistanceKm(origin, b) : 0);
  const food = category((item) => ["restaurant", "cafe", "food_route"].includes(item.type));
  const places = category((item) => ["expedition", "museum", "craft"].includes(item.type));
  const surprises = category((item) => ["expedition", "museum", "craft", "festival", "event"].includes(item.type));
  const photos: Record<string, string> = {
    "detras-de-la-catedral": "/images/restaurants/detras-de-la-catedral.jpg",
    "el-olimpico": "/images/restaurants/el-olimpico.jpg",
    "bicho": "/images/cafes/bicho.jpg",
    "cerrito-libertad": "/images/expeditions/cerrito.jpg",
    "torre-torre": "/images/expeditions/torretorre.jpg",
  };
  function slides(experiences: Experience[]) {
    return experiences.map((experience) => {
      const image = photos[experience.slug] ||
        ([experience.image, experience.coverImage].find((value) => value && !/logo|placeholder/i.test(value)) ?? undefined);
      const ready = readyIds.has(experience.experienceId);
      const distance = origin ? `${getHaversineDistanceKm(origin, experience).toFixed(1)} km` : null;
      return {
        id: experience.experienceId,
        title: experience.title,
        subtitle: [!ready && tx("Para otra ocasión · Consulta horarios y condiciones"), distance && `${distance} · ${position ? tx("Desde tu ubicación") : tx("Desde tu punto de regreso")}`,
          experience.description || tx("Descubre este lugar"),
          !origin && tx("Activa tu ubicación para ordenar por cercanía")].filter(Boolean).join(" · "),
        image,
        actionLabel: ready ? tx("Iniciar misión") : tx("Ver detalles"),
        onClick: () => {
          if (!ready) { openExperience(experience); return; }
          const eligible = getRecommendations({ profile, location: origin ?? undefined }, { weather: liveWeather, experiences: [experience] });
          if (!eligible.length) { openExperience(experience); return; }
          if (startWalking(experience)) navigate("/journey");
        },
      };
    });
  }
  const quickActions = [
    { id: "food", direction: "up" as const, title: tx("¿Dónde puedo comer algo rico cerca?"),
      subtitle: tx("Restaurantes y cafés recomendados alrededor de ti"), tone: "magenta" as const,
      image: papaHuancainaImage, slides: slides(food),
      onClick: () => navigate("/mapa?nearby=food") },
    { id: "corners", direction: "right" as const, title: tx("Circuito turístico"),
      subtitle: tx("Miradores, historias y lugares ocultos"), tone: "cyan" as const,
      image: cerritoImage, slides: slides(places), onClick: () => openExperience(cornerExperience) },
    { id: "huariques", direction: "left" as const, title: tx("Descubrir huariques"),
      subtitle: tx("Sabores locales con historia, verificados por I.GUIDE"), tone: "magenta" as const,
      image: pachamancaImage, slides: slides(category(isVerifiedHuarique)),
      onClick: () => navigate("/mapa?nearby=huariques") },
    { id: "surprise", direction: "down" as const, title: tx("Sorpresa local"),
      subtitle: tx("Algo que Huancayo está viviendo hoy"), tone: "magenta" as const,
      image: santiagoImage, slides: slides(surprises), onClick: () => openExperience(surpriseExperience) },
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
