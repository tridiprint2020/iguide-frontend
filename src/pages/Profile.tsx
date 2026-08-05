import { useEffect, useState } from "react";
import { loadUserProfile } from "../data/user";
import { catalog } from "../data/catalog";
import { Theme } from "../styles/theme";
import type { UserProfile } from "../types/user/user";

// ============================================================
// BADGES — calculados en cliente a partir de UserProfile.
// No requieren nueva tabla ni cambios de tipo.
// ============================================================
type Badge = {
  id: string;
  emoji: string;
  label: string;
  description: string;
  unlocked: boolean;
};

function computeBadges(profile: UserProfile): Badge[] {
  const visited = profile.visitedExperiences.length;
  const favorites = profile.favorites.length;

  return [
    {
      id: "primer_paso",
      emoji: "🥾",
      label: "Primer Paso",
      description: "Completa tu primera expedición",
      unlocked: visited >= 1,
    },
    {
      id: "caminante_valle",
      emoji: "🏔️",
      label: "Caminante del Valle",
      description: "Completa 5 expediciones",
      unlocked: visited >= 5,
    },
    {
      id: "gran_explorador",
      emoji: "🌄",
      label: "Gran Explorador",
      description: "Completa 10 expediciones",
      unlocked: visited >= 10,
    },
    {
      id: "nivel_3",
      emoji: "⭐",
      label: "Explorador Wanka",
      description: "Alcanza el nivel 3",
      unlocked: profile.level >= 3,
    },
    {
      id: "coleccionista",
      emoji: "💛",
      label: "Coleccionista",
      description: "Guarda 5 lugares en favoritos",
      unlocked: favorites >= 5,
    },
  ];
}

// ============================================================
// Helpers de progreso — usa la misma fórmula que completeExpedition
// en data/user.ts (300 XP por nivel). Si esa fórmula cambia,
// actualizar aquí también.
// ============================================================
const XP_PER_LEVEL = 300;

function getXpProgress(profile: UserProfile) {
  const xpIntoLevel = profile.experience % XP_PER_LEVEL;
  const percent = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));
  return {
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    percent,
  };
}

function getExperienceTitle(experienceId: string): string {
  const match = catalog.find((item) => item.experienceId === experienceId);
  return match?.title ?? experienceId;
}

const travelModeLabel: Record<string, string> = {
  solo: "Explorador Solo",
  couple: "Explorador en Pareja",
  family: "Explorador en Familia",
  friends: "Explorador con Amigos",
};

function Profile() {
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());

  // Sincroniza si XP/favoritos cambian en otra pantalla (evento ya disparado por data/user.ts)
  useEffect(() => {
    function handleUpdate(event: Event) {
      const detail = (event as CustomEvent<UserProfile>).detail;
      if (detail) setProfile(detail);
    }
    window.addEventListener("iguide-user-updated", handleUpdate);
    return () => window.removeEventListener("iguide-user-updated", handleUpdate);
  }, []);

  const badges = computeBadges(profile);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const xp = getXpProgress(profile);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: Theme.Colors.background,
        color: Theme.Colors.text,
        padding: Theme.Space.md,
        paddingBottom: "80px", // deja espacio para bottom nav / bubble
        boxSizing: "border-box",
      }}
    >
      {/* ============ HEADER: IDENTIDAD ============ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: Theme.Space.md,
          marginBottom: Theme.Space.lg,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: Theme.Colors.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {profile.name}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: Theme.Colors.textSoft }}>
            {travelModeLabel[profile.travelMode] ?? "Explorador"} · Nivel {profile.level}
          </p>
        </div>
      </div>

      {/* ============ XP / NIVEL ============ */}
      <div
        style={{
          backgroundColor: Theme.Colors.surface,
          borderRadius: Theme.Radius.medium,
          padding: Theme.Space.md,
          marginBottom: Theme.Space.md,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            marginBottom: 6,
            color: Theme.Colors.textSoft,
          }}
        >
          <span>Nivel {profile.level}</span>
          <span>{xp.xpIntoLevel} / {xp.xpForNextLevel} XP</span>
        </div>
        <div
          style={{
            width: "100%",
            height: 8,
            borderRadius: 999,
            backgroundColor: `${Theme.Colors.textSoft}33`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${xp.percent}%`,
              height: "100%",
              backgroundColor: Theme.Colors.primary,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* ============ STATS RÁPIDOS ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: Theme.Space.sm,
          marginBottom: Theme.Space.lg,
        }}
      >
        <StatCard label="Expediciones" value={profile.visitedExperiences.length} />
        <StatCard label="Favoritos" value={profile.favorites.length} />
        <StatCard label="Insignias" value={`${unlockedBadges.length}/${badges.length}`} />
      </div>

      {/* ============ BADGES ============ */}
      <SectionTitle>Insignias</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: Theme.Space.sm,
          marginBottom: Theme.Space.lg,
        }}
      >
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            style={{
              backgroundColor: Theme.Colors.surface,
              borderRadius: Theme.Radius.medium,
              padding: Theme.Space.sm,
              textAlign: "center",
              opacity: badge.unlocked ? 1 : 0.35,
              border: badge.unlocked
                ? `1px solid ${Theme.Colors.primary}55`
                : "1px solid transparent",
            }}
          >
            <div style={{ fontSize: 26 }}>{badge.emoji}</div>
            <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600 }}>
              {badge.label}
            </div>
          </div>
        ))}
      </div>

      {/* ============ HISTORIAL ============ */}
      <SectionTitle>Recorridos completados</SectionTitle>
      {profile.visitedExperiences.length === 0 ? (
        <p style={{ fontSize: 13, color: Theme.Colors.textSoft }}>
          Aún no completas ninguna expedición. ¡Sal a explorar Huancayo! 🧭
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: Theme.Space.sm }}>
          {profile.visitedExperiences.map((experienceId) => (
            <div
              key={experienceId}
              style={{
                backgroundColor: Theme.Colors.surface,
                borderRadius: Theme.Radius.medium,
                padding: Theme.Space.sm,
                fontSize: 14,
              }}
            >
              🧭 {getExperienceTitle(experienceId)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radius.medium,
        padding: Theme.Space.sm,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: Theme.Colors.textSoft }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 14,
        fontWeight: 700,
        marginBottom: Theme.Space.sm,
        color: Theme.Colors.textSoft,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {children}
    </h3>
  );
}

export default Profile;