import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  Heart,
  House,
  MapPin,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  loadUserProfile,
} from "../data/user";

import {
  catalog,
} from "../data/catalog";

import LocalityIndexCard from "../components/profile/LocalityIndexCard";

import logoIG from "../assets/branding/logo-dark-bg.png";

import {
  Theme,
} from "../styles/theme";

import type {
  UserProfile,
} from "../types/user/user";
import { tx } from "../i18n";

function Profile() {
  const navigate =
    useNavigate();

  const [
    profile,
    setProfile,
  ] = useState<UserProfile>(
    () => loadUserProfile()
  );

  useEffect(() => {
    function refreshProfile() {
      setProfile(
        loadUserProfile()
      );
    }

    window.addEventListener(
      "iguide-user-updated",
      refreshProfile
    );

    window.addEventListener(
      "storage",
      refreshProfile
    );

    return () => {
      window.removeEventListener(
        "iguide-user-updated",
        refreshProfile
      );

      window.removeEventListener(
        "storage",
        refreshProfile
      );
    };
  }, []);

  const totalActiveExperiences =
    useMemo(
      () =>
        catalog.filter(
          (experience) =>
            experience.isActive !==
            false
        ).length,
      []
    );

  const visitedCount =
    new Set(
      profile.visitedExperiences
    ).size;

  const favoriteCount =
    profile.favorites.length;

  const achievementCount =
    profile.achievements.length;

  const currentLevelXp =
    profile.experience % 300;

  const xpToNextLevel =
    currentLevelXp === 0 &&
    profile.experience > 0
      ? 300
      : 300 - currentLevelXp;

  const levelProgress =
    Math.min(
      Math.round(
        (
          currentLevelXp /
          300
        ) * 100
      ),
      100
    );

  const cityProgress =
    totalActiveExperiences > 0
      ? Math.min(
          Math.round(
            (
              visitedCount /
              totalActiveExperiences
            ) * 100
          ),
          100
        )
      : 0;

  const displayName =
    profile.name?.trim() ||
    tx("Explorador");

  return (
    <main
      style={{
        minHeight: "100vh",

        boxSizing: "border-box",

        padding:
          "16px 14px 40px",

        background:
          "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.10), transparent 32%), #0D0E13",

        color:
          Theme.Colors.text,
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: "620px",

          margin: "0 auto",
        }}
      >
        {/* CABECERA */}
        <header
          style={{
            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            gap: "12px",

            marginBottom: "20px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            style={{
              minHeight: "40px",

              display: "flex",

              alignItems: "center",

              gap: "7px",

              padding:
                "8px 13px",

              borderRadius:
                "12px",

              border:
                "1px solid rgba(255,255,255,0.10)",

              background:
                "rgba(255,255,255,0.06)",

              color: "#FFFFFF",

              fontSize: "12px",

              fontWeight: 750,

              cursor: "pointer",
            }}
          >
            <House
              size={16}
              strokeWidth={2.2}
            />

            {tx("Inicio")}
          </button>

          <img
            src={logoIG}
            alt="I.GUIDE"
            style={{
              width: "68px",

              maxHeight: "46px",

              display: "block",

              objectFit: "contain",
            }}
          />
        </header>

        {/* IDENTIDAD */}
        <section
          style={{
            display: "flex",

            alignItems: "center",

            gap: "15px",

            marginBottom: "18px",

            padding: "18px",

            borderRadius: "22px",

            background:
              "linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",

            border:
              "1px solid rgba(255,255,255,0.08)",

            boxShadow:
              "0 16px 35px rgba(0,0,0,0.22)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "68px",

              height: "68px",

              flexShrink: 0,

              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              borderRadius: "22px",

              background:
                "linear-gradient(145deg, #FF00FF, #C60073)",

              color: "#FFFFFF",

              boxShadow:
                "0 10px 28px rgba(255,0,122,0.30)",
            }}
          >
            <UserRound
              size={31}
              strokeWidth={2}
            />
          </div>

          <div
            style={{
              minWidth: 0,

              flex: 1,
            }}
          >
            <span
              style={{
                display: "block",

                marginBottom: "4px",

                color:
                  Theme.Colors.primary,

                fontSize: "9px",

                fontWeight: 850,

                letterSpacing:
                  "0.12em",

                textTransform:
                  "uppercase",
              }}
            >
              {tx("Pasaporte local")}
            </span>

            <h1
              style={{
                margin: 0,

                color: "#FFFFFF",

                fontFamily:
                  Theme.Typography.title,

                fontSize:
                  "clamp(1.7rem, 7vw, 2.4rem)",

                lineHeight: 1.05,

                overflowWrap:
                  "anywhere",
              }}
            >
              {displayName}
            </h1>

            <p
              style={{
                margin:
                  "7px 0 0",

                color:
                  Theme.Colors.textSoft,

                fontSize: "12px",
              }}
            >
              {tx("Nivel")} {profile.level} ·{" "}
              {profile.experience} XP
            </p>
          </div>
        </section>

        {/* ÍNDICE DE LOCALIDAD */}
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <LocalityIndexCard
            profile={profile}
          />
        </div>

        {/* XP */}
        <section
          style={{
            marginBottom: "18px",

            padding: "17px",

            borderRadius: "20px",

            background:
              Theme.Colors.surface,

            border:
              "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",

              justifyContent:
                "space-between",

              gap: "12px",

              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",

                alignItems: "center",

                gap: "8px",
              }}
            >
              <Star
                size={18}
                strokeWidth={2.2}
                color={
                  Theme.Colors.primary
                }
              />

              <span
                style={{
                  color: "#FFFFFF",

                  fontSize: "13px",

                  fontWeight: 800,
                }}
              >
                {tx("Progreso XP")}
              </span>
            </div>

            <strong
              style={{
                color:
                  Theme.Colors.primary,

                fontSize: "12px",
              }}
            >
              {tx("Nivel")} {profile.level}
            </strong>
          </div>

          <div
            style={{
              width: "100%",

              height: "9px",

              overflow: "hidden",

              borderRadius: "999px",

              background:
                "rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width:
                  `${levelProgress}%`,

                height: "100%",

                borderRadius:
                  "999px",

                background:
                  "linear-gradient(90deg, #FF00FF, #FF007A)",

                transition:
                  "width 0.35s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              gap: "10px",

              marginTop: "8px",

              color:
                Theme.Colors.textSoft,

              fontSize: "10px",
            }}
          >
            <span>
              {profile.experience} {tx("XP acumulados")}
            </span>

            <span>
              {xpToNextLevel} {tx("XP para subir")}
            </span>
          </div>
        </section>

        {/* ESTADÍSTICAS */}
        <section
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",

            gap: "10px",

            marginBottom: "18px",
          }}
        >
          <StatCard
            icon={MapPin}
            label={tx("Descubrimientos")}
            value={`${visitedCount}`}
            detail={tx("{{progress}}% de la ciudad", { progress: cityProgress })}
          />

          <StatCard
            icon={Heart}
            label={tx("Favoritos")}
            value={`${favoriteCount}`}
            detail={tx("Lugares guardados")}
          />

          <StatCard
            icon={Award}
            label={tx("Insignias")}
            value={`${achievementCount}`}
            detail={tx("Logros obtenidos")}
          />

          <StatCard
            icon={Sparkles}
            label={tx("Experiencias")}
            value={`${totalActiveExperiences}`}
            detail={tx("Disponibles ahora")}
          />
        </section>

        {/* EXPLORACIÓN */}
        <section
          style={{
            padding: "18px",

            borderRadius: "20px",

            background:
              "linear-gradient(145deg, rgba(255,0,255,0.10), rgba(255,255,255,0.035))",

            border:
              "1px solid rgba(255,0,255,0.20)",

            textAlign: "center",
          }}
        >
          <Sparkles
            size={24}
            strokeWidth={2}
            color={
              Theme.Colors.primary
            }
          />

          <h2
            style={{
              margin:
                "9px 0 5px",

              color: "#FFFFFF",

              fontSize: "17px",
            }}
          >
            {tx("Sigue aumentando tu localidad")}
          </h2>

          <p
            style={{
              margin:
                "0 0 14px",

              color:
                Theme.Colors.textSoft,

              fontSize: "11px",

              lineHeight: 1.5,
            }}
          >
            {tx("Completa nuevas misiones, descubre lugares y vive Huancayo como alguien de aquí.")}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/explorer")
            }
            style={{
              width: "100%",

              minHeight: "46px",

              border: "none",

              borderRadius: "13px",

              background:
                "linear-gradient(145deg, #FF00FF, #E0008A)",

              color: "#FFFFFF",

              fontSize: "12px",

              fontWeight: 850,

              cursor: "pointer",

              boxShadow:
                "0 9px 24px rgba(255,0,122,0.26)",
            }}
          >
            {tx("Explorar nuevas misiones")} →
          </button>
        </section>
      </div>
    </main>
  );
}

type StatIcon =
  typeof MapPin;

type StatCardProps = {
  icon: StatIcon;
  label: string;
  value: string;
  detail: string;
};

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: StatCardProps) {
  return (
    <article
      style={{
        minHeight: "120px",

        boxSizing: "border-box",

        padding: "15px",

        borderRadius: "18px",

        background:
          Theme.Colors.surface,

        border:
          "1px solid rgba(255,255,255,0.07)",

        boxShadow:
          "0 12px 26px rgba(0,0,0,0.17)",
      }}
    >
      <Icon
        size={18}
        strokeWidth={2.1}
        color={
          Theme.Colors.primary
        }
      />

      <strong
        style={{
          display: "block",

          marginTop: "11px",

          color: "#FFFFFF",

          fontSize: "22px",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",

          marginTop: "2px",

          color: "#FFFFFF",

          fontSize: "11px",

          fontWeight: 750,
        }}
      >
        {label}
      </span>

      <span
        style={{
          display: "block",

          marginTop: "4px",

          color:
            Theme.Colors.textSoft,

          fontSize: "9px",
        }}
      >
        {detail}
      </span>
    </article>
  );
}

export default Profile;
