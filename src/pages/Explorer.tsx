import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

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
  catalog,
} from "../data/catalog";

import {
  useJourney,
} from "../context/JourneyContext";

import MapView from "../components/MapView";

import {
  NameCaptureModal,
} from "../components/NameCaptureModal";

import type {
  UserProfile,
} from "../types/user/user";

import logoIG from "../assets/optimized/logoig.webp";
import type {
  HospesMessage,
} from "../types/hospes";

import {
  Theme,
} from "../styles/theme";

import {
  tx,
} from "../i18n";

const CYAN_ACCENT = "#39E7FF";

function Explorer() {
  const [
    user,
    setUser,
  ] = useState<UserProfile>(
    () => loadUserProfile()
  );

  const [
    showNameModal,
    setShowNameModal,
  ] = useState(false);

  const [
    ,
    setHasSeenModal,
  ] = useState(false);

  const navigate =
    useNavigate();

  const {
    resetToHome,
    startWalking,
  } = useJourney();

  const recommendations =
    getRecommendations({
      profile: user,
    });

  const suggestedExperience =
    recommendations[0] ?? null;

  const visitedCount =
    new Set(
      user.visitedExperiences
    ).size;

  const totalActiveExperiences =
    catalog.filter(
      (experience) =>
        experience.isActive !== false
    ).length;

  const progressPercent =
    totalActiveExperiences > 0
      ? Math.round(
          (visitedCount /
            totalActiveExperiences) *
            100
        )
      : 0;

  const baseHospesBannerMessage =
  getHospesMessage({
    screen: "explorer",

    suggestedExperience,

    progress: {
      visitedCount,

      totalCount:
        totalActiveExperiences,
    },
  });

const hospesBannerMessage:
  HospesMessage = {
  ...baseHospesBannerMessage,

  title:
    tx("MODO EXPLORADOR"),

  message:
    visitedCount === 0
      ? tx("Tengo algo local preparado para ti. Déjame elegir una primera misión sencilla según el momento.")
      : tx(
          "Ya descubriste {{visited}} de {{total}} experiencias. Déjame elegir algo diferente para continuar tu historia.",
          {
            visited: visitedCount,
            total: totalActiveExperiences,
          }
        ),

  action:
    suggestedExperience
      ? {
          type:
            "open-experience",

          target:
            suggestedExperience.slug,

          label:
            tx("Sorpréndeme"),
        }
      : baseHospesBannerMessage.action
        ? {
            ...baseHospesBannerMessage.action,

            label:
              tx("Sorpréndeme"),
          }
        : undefined,
};

  function handlePrimaryAction() {
    if (suggestedExperience) {
      startWalking(
        suggestedExperience
      );

      navigate("/journey");
      return;
    }

    const action =
      hospesBannerMessage.action;

    if (!action) {
      navigate("/hospes");
      return;
    }

    navigate(action.target);
  }

  function handleGoHome() {
    /*
     * Cambia únicamente la pantalla visible.
     * La misión persistida podrá retomarse
     * mediante la burbuja global.
     */
    resetToHome();
    navigate("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",

        boxSizing: "border-box",

        backgroundColor:
          Theme.Colors.background,

        padding:
          "16px 12px 40px",
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: "600px",

          margin: "0 auto",

          position: "relative",
        }}
      >
        {/* ÚNICO ENCABEZADO */}
        <header
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            gap: "14px",

            marginBottom: "15px",
          }}
        >
          <button
            type="button"
            onClick={handleGoHome}
            style={{
              minHeight: "40px",

              padding:
                "8px 14px",

              borderRadius:
                "12px",

              border:
                "1px solid rgba(255,255,255,0.10)",

              background:
                "rgba(255,255,255,0.06)",

              color:
                Theme.Colors.text,

              fontSize: "12px",

              fontWeight: 750,

              cursor: "pointer",
            }}
          >
            ← {tx("Inicio")}
          </button>

          <img
            src={logoIG}
            alt="I.GUIDE"
            style={{
              width: "72px",

              maxHeight: "48px",

              objectFit: "contain",

              display: "block",
            }}
          />
        </header>

        {/* B) NOTA DE HOSPES */}
        <div
          style={{
            borderRadius: "24px",
            padding: "18px",
            background:
              "linear-gradient(135deg, rgba(255,0,200,0.16), rgba(0,20,40,0.78))",
            border: "1px solid rgba(255,0,200,0.28)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(180deg, rgba(255,0,200,0.22), rgba(255,0,200,0.08))",
                border: "1px solid rgba(255,0,200,0.35)",
                boxShadow: "0 0 24px rgba(255,0,200,0.35)",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "24px" }}>✦</span>
            </div>

            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#FF00C8",
                }}
              >
                {tx("HOSPES · EXPLORA CERCA DE TI")}
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: 1.45,
                  color: "#FFFFFF",
                }}
              >
                {hospesBannerMessage.message}
              </p>
            </div>
          </div>
        </div>

        {/* C) PASAPORTE COMPACTO */}
        <section
          aria-label={tx("Pasaporte del explorador")}
          style={{
            minHeight: "108px",
            boxSizing: "border-box",
            marginBottom: "14px",
            padding: "13px 15px",
            borderRadius: "19px",
            background:
              "linear-gradient(145deg, rgba(22,22,39,0.98), rgba(13,14,28,0.98))",
            border:
              "1px solid rgba(57,231,255,0.16)",
            boxShadow:
              "0 14px 32px rgba(0,0,0,0.24)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <strong
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#FFFFFF",
                fontSize: "19px",
              }}
            >
              {user.name}
            </strong>

            <span
              style={{
                flexShrink: 0,
                padding: "6px 10px",
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, #FF00C8, #B500FF)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 850,
                boxShadow:
                  "0 0 18px rgba(255,0,200,0.24)",
              }}
            >
              {tx("NIVEL {{level}}", {
                level: user.level,
              })}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "10px",
              color: "rgba(255,255,255,0.58)",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>
              XP{" "}
              <strong
                style={{
                  color: "#FFFFFF",
                  fontSize: "13px",
                }}
              >
                {user.experience}
              </strong>
            </span>

            <span style={{ textAlign: "center" }}>
              Local{" "}
              <strong
                style={{
                  color: CYAN_ACCENT,
                  fontSize: "13px",
                }}
              >
                {progressPercent}%
              </strong>
            </span>

            <span style={{ textAlign: "right" }}>
              {tx("Lugares")}{" "}
              <strong
                style={{
                  color: "#FFFFFF",
                  fontSize: "13px",
                }}
              >
                {visitedCount}/{totalActiveExperiences}
              </strong>
            </span>
          </div>

          <div
            style={{
              height: "5px",
              marginTop: "10px",
              overflow: "hidden",
              borderRadius: "999px",
              background:
                "rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: `${Math.max(3, progressPercent)}%`,
                height: "100%",
                borderRadius: "999px",
                background: `linear-gradient(90deg, ${CYAN_ACCENT}, #00BFFF)`,
                boxShadow:
                  `0 0 14px ${CYAN_ACCENT}`,
              }}
            />
          </div>
        </section>

        <MapView
          track={null}
        />

        {/* D) BOTÓN SORPRÉNDEME DEBAJO DEL MAPA */}
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={handlePrimaryAction}
            style={{
              width: "100%",
              minHeight: "54px",
              border: "none",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #FF00C8, #D100FF)",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 12px 32px rgba(255,0,200,0.30)",
            }}
          >
            {tx("Sorpréndeme")} →
          </button>
        </div>

        <section
          style={{
            marginTop: "16px",

            padding: "18px",

            borderRadius: "18px",

            background:
              "linear-gradient(145deg, rgba(255,0,255,0.13), #151515 62%)",

            border:
              "1px solid rgba(255,0,255,0.23)",

            boxShadow:
              "0 14px 30px rgba(0,0,0,0.22)",

            color: "#FFFFFF",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems:
                "flex-start",

              gap: "12px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: "42px",

                height: "42px",

                flexShrink: 0,

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "14px",

                background:
                  "rgba(255,0,255,0.15)",

                border:
                  "1px solid rgba(255,0,255,0.25)",

                fontSize: "21px",
              }}
            >
              🧭
            </div>

            <div
              style={{
                minWidth: 0,

                flex: 1,
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 6px",

                  fontSize:
                    "18px",
                }}
              >
                {tx("¿Te ayudo a buscar?")}
              </h2>

              <p
                style={{
                  margin:
                    "0 0 14px",

                  color:
                    "rgba(255,255,255,0.70)",

                  fontSize:
                    "12px",

                  lineHeight: 1.5,
                }}
              >
                {tx("Cuéntame qué deseas comer, conocer o hacer. Hospes buscará una experiencia según la hora, el clima y tus preferencias.")}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/hospes")
                }
                style={{
                  width: "100%",

                  minHeight:
                    "44px",

                  padding:
                    "10px 14px",

                  border: "none",

                  borderRadius:
                    "12px",

                  backgroundColor:
                    Theme.Colors.primary,

                  color:
                    "#FFFFFF",

                  fontWeight: 800,

                  cursor: "pointer",
                }}
              >
                {tx("Preguntar a Hospes")} →
              </button>
            </div>
          </div>
        </section>

        {showNameModal && (
          <NameCaptureModal
            onClose={() => {
              setShowNameModal(false);
              setHasSeenModal(true);
            }}
            onProfileUpdated={(
              newUser
            ) =>
              setUser(newUser)
            }
          />
        )}
      </div>
    </main>
  );
}

export default Explorer;
