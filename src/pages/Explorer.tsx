import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadUserProfile } from "../data/user";
import { getRecommendations } from "../engine/recommendationEngine";
import { catalog } from "../data/catalog";
import PassportCard from "../components/PassportCard";
import ExperienceCard from "../components/ExperienceCard";
import MapView from "../components/MapView";
import { NameCaptureModal } from "../components/NameCaptureModal";

import type { UserProfile } from "../types/user/user";
import { Theme } from "../styles/theme";
import HospesBanner from "../components/hospes/HospesBanner";
import { getHospesMessage } from "../engine/hospesContextEngine";

function Explorer() {
  const [user, setUser] = useState<UserProfile>(() => loadUserProfile());
  const [showNameModal, setShowNameModal] = useState(false);
  const [, setHasSeenModal] = useState(false);

  const navigate = useNavigate();

  const recommendations = getRecommendations({
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

  return (
    <div
      style={{
        backgroundColor: Theme.Colors.background,
        minHeight: "100vh",
        padding: Theme.Space.lg,
      }}
    >
     <HospesBanner
  message={hospesBannerMessage}
  onAction={() => {
    const action =
      hospesBannerMessage.action;

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
  }}
/>
      {/* 🏠 BARRA DE NAVEGACIÓN DE ESCAPE (REGLA 22) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/")} // Te saca de inmediato a la pantalla de bienvenida o Home central
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#A0A0A0",
            padding: "8px 16px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          🏠 Inicio
        </button>
        <span style={{ fontSize: "12px", color: "#666" }}>I.GUIDE v2.0</span>
      </div>
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <h1
          style={{
            color: Theme.Colors.text,
            fontFamily: Theme.Typography.title,
            marginBottom: Theme.Space.md,
          }}
        >
          Explora Huancayo
        </h1>

        <PassportCard user={user} />

        <MapView track={null} />

        
        <div
          style={{
            marginTop: Theme.Space.lg,
            display: "flex",
            flexDirection: "column",
            gap: Theme.Space.sm,
          }}
        >
          {recommendations.map((expedition) => {
            const isVisited = user.visitedExperiences.includes(expedition.experienceId);

            return (
              <div
                key={expedition.experienceId}
                style={{
                  position: "relative",
                  opacity: isVisited ? 0.75 : 1,
                  border: isVisited
                    ? `1px solid ${Theme.Colors.secondary}`
                    : "1px solid transparent",
                  borderRadius: Theme.Radius.medium,
                }}
              >
                {isVisited && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      backgroundColor: Theme.Colors.secondary,
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: Theme.Radius.pill,
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    ✔️ Conquistado
                  </div>
                )}

                <ExperienceCard expedition={expedition} />

                {!isVisited && (
                  <button
                    onClick={() =>
                      navigate(`/expedition/${expedition.slug}`)
                    }
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      padding: "10px",
                      borderRadius: Theme.Radius.medium,
                      border: "none",
                      backgroundColor: Theme.Colors.primary,
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🧭 Iniciar recorrido real →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showNameModal && (
          <NameCaptureModal
            onClose={() => {
              setShowNameModal(false);
              setHasSeenModal(true);
            }}
            onProfileUpdated={(newUser) => setUser(newUser)}
          />
        )}
      </div>
    </div>
  );
}

export default Explorer;