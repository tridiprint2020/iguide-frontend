import type { UserProfile } from "../types/user/user";
import {
  getExplorerRank,
  rankLabels,
  getXPToNextLevel,
  achievementLabels,
  type AchievementId,
} from "../engine/scoreEngine";
import { getExplorationProgress } from "../engine/journeyEngine";
import { Theme } from "../styles/theme";
// 🏛️ Paso 1: Importar el catálogo real arriba del archivo
import { catalog } from "../data/catalog";
import { tx } from "../i18n";

type Props = {
  user: UserProfile;
};

function PassportCard({ user }: Props) {
  const rank = getExplorerRank(user.level);
  const rankName = tx(rankLabels[rank]);
  const xpToNext = getXPToNextLevel(user.experience);
  const currentLevelXP = user.experience % 300;
  const progressPercent = (currentLevelXP / 300) * 100;

  // 🏛️ Paso 2: Calcular el universo real de expediciones activas
  const totalActiveExperiences = catalog.filter(
  (experience) =>
    experience.isActive !== false
).length;

const explorationProgress = getExplorationProgress(
  user,
  totalActiveExperiences
);

  const knownAchievements = user.achievements.filter(
    (id): id is AchievementId => id in achievementLabels
  );

  return (
    <div
      style={{
        backgroundColor: Theme.Colors.surface,
        color: Theme.Colors.text,
        borderRadius: Theme.Radius.medium,
        padding: Theme.Space.lg,
        boxShadow: Theme.Shadows.card,
        maxWidth: "340px",
        margin: `${Theme.Space.md}px auto`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: Theme.Space.sm,
        }}
      >
        <span style={{ fontSize: "12px", color: Theme.Colors.textSoft }}>
          {tx("PASAPORTE EXPLORADOR")}
        </span>
        <span
          style={{
            backgroundColor: Theme.Colors.primary,
            padding: "3px 10px",
            borderRadius: Theme.Radius.pill,
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {tx("Nivel")} {user.level}
        </span>
      </div>

      <h3 style={{ margin: 0 }}>{user.name}</h3>
      <p style={{ margin: `4px 0 ${Theme.Space.sm}px`, color: Theme.Colors.textSoft }}>
        {rankName}
      </p>

      <div style={{ fontSize: "13px", marginBottom: "4px" }}>
        {xpToNext} {tx("XP para el siguiente nivel")}
      </div>
      <div
        style={{
          width: "100%",
          height: "6px",
          backgroundColor: "#2A2A38",
          borderRadius: Theme.Radius.pill,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            backgroundColor: Theme.Colors.secondary,
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* 🌎 Barra de progreso de la ciudad (Journey Engine) */}
      <div style={{ marginTop: Theme.Space.md }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            marginBottom: "6px",
            color: Theme.Colors.textSoft,
          }}
        >
          <span>{tx("Progreso del Valle")}</span>
          <span style={{ color: Theme.Colors.secondary, fontWeight: "bold" }}>
            {explorationProgress}% {tx("descubierto")}
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#2A2A38",
            borderRadius: Theme.Radius.pill,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${explorationProgress}%`,
              height: "100%",
              backgroundColor: Theme.Colors.secondary,
              transition: "width 0.4s ease-out",
            }}
          />
        </div>
      </div>

      {knownAchievements.length > 0 && (
        <div style={{ marginTop: Theme.Space.md }}>
          <span style={{ fontSize: "12px", color: Theme.Colors.textSoft }}>
            {tx("LOGROS DESBLOQUEADOS")}
          </span>
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
            {knownAchievements.map((id) => (
              <li key={id} style={{ marginBottom: "6px", fontSize: "13px" }}>
                🏅 <strong>{tx(achievementLabels[id].title)}</strong>
                <br />
                <span style={{ color: Theme.Colors.textSoft, fontSize: "12px" }}>
                  {tx(achievementLabels[id].description)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PassportCard;
