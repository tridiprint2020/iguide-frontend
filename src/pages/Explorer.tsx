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

import PassportCard from "../components/PassportCard";
import MapView from "../components/MapView";

import {
  NameCaptureModal,
} from "../components/NameCaptureModal";

import HospesBanner from "../components/hospes/HospesBanner";

import type {
  UserProfile,
} from "../types/user/user";

import logoIG from "../assets/placeholders/logoIG.png";

import {
  Theme,
} from "../styles/theme";

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

  const hospesBannerMessage =
    getHospesMessage({
      screen: "explorer",

      suggestedExperience,

      progress: {
        visitedCount,

        totalCount:
          totalActiveExperiences,
      },
    });

  function handleHospesAction() {
    const action =
      hospesBannerMessage.action;

    if (!action) {
      navigate("/hospes");
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
            ← Inicio
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

        <div
          style={{
            marginBottom: "14px",
          }}
        >
          <span
            style={{
              display: "block",

              marginBottom: "3px",

              color:
                Theme.Colors.primary,

              fontSize: "10px",

              fontWeight: 850,

              letterSpacing:
                "0.12em",

              textTransform:
                "uppercase",
            }}
          >
            Feel the City
          </span>

          <h1
            style={{
              margin: 0,

              color:
                Theme.Colors.text,

              fontFamily:
                Theme.Typography.title,

              fontSize:
                "clamp(1.7rem, 6vw, 2.3rem)",

              lineHeight: 1.08,
            }}
          >
            Explora Huancayo
          </h1>
        </div>

        <HospesBanner
          message={
            hospesBannerMessage
          }
          onAction={
            handleHospesAction
          }
        />

        <PassportCard
          user={user}
        />

        <MapView
          track={null}
        />

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
                ¿Te ayudo a buscar?
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
                Cuéntame qué deseas
                comer, conocer o hacer.
                Hospes buscará una
                experiencia según la
                hora, el clima y tus
                preferencias.
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
                Preguntar a Hospes →
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