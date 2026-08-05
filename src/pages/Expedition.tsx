// ✅ CORREGIDO: Importación limpia libre de variables muertas
import { useState } from "react"; 
import { useParams, useNavigate } from "react-router-dom";
import { catalog } from "../data/catalog";
import { difficultyLabels } from "../types/difficulty";
import ExpeditionMap from "../components/ExpeditionMap";
import TrackingPanel from "../components/TrackingPanel";
import MemoryPreviewModal from "../components/sharing/MemoryPreviewModal"; 
import { Theme } from "../styles/theme";
import type { MemoryCardData } from "../types/memoryCard"; 
import { useJourney } from "../context/JourneyContext";
import type { Experience } from "../types/experience";
import type { TimelineItem } from "../types/tracking/tracking";
import { loadTrack } from "../engine/trackingEngine";
import HospesBanner from "../components/hospes/HospesBanner";
import { getHospesMessage } from "../engine/hospesContextEngine";

type ExpeditionExperience = Experience & {
  distance: string;
  driveTime: string;
  walkTime: string;
  duration: string;
  price: string;
  difficulty: keyof typeof difficultyLabels; // ✅ Corregido nativamente según firmas de diccionario
  hospes: string;
  photo?: string;
};

function Expedition() {
  const { slug } = useParams();
const navigate = useNavigate();

const {
  journey,
  startWalking,
} = useJourney();

const expeditionBase = catalog.find(
  (experience) =>
    experience.slug === slug
);

if (!expeditionBase) {
  return (
    <div
      style={{
        padding: Theme.Space.xl,
        textAlign: "center",
        backgroundColor: "#0A0A0A",
        minHeight: "100vh",
        color: "#FFFFFF",
      }}
    >
      <h1>Expedición no encontrada.</h1>

      <button
        type="button"
        onClick={() =>
          navigate("/explorer")
        }
      >
        ← Volver
      </button>
    </div>
  );
}

const expedition =
  expeditionBase as ExpeditionExperience;

const persistedTrack =
  journey.experience?.experienceId ===
  expedition.experienceId
    ? loadTrack(
        expedition.experienceId
      )
    : null;

const currentTrack =
  journey.experience?.experienceId ===
  expedition.experienceId
    ? {
        experienceId:
          expedition.experienceId,

        sessionId:
          persistedTrack?.sessionId ??
          String(
            journey.startedAt ??
              Date.now()
          ),

        startedAt:
          journey.startedAt ??
          Date.now(),

        timeline:
          journey.timeline,

        ...(journey.state ===
        "COMPLETED"
          ? {
              completedAt:
                persistedTrack?.completedAt ??
                Date.now(),
            }
          : {}),
      }
    : null;

const [shareOpen, setShareOpen] =
  useState(false);

const [activeMemory, setActiveMemory] =
  useState<MemoryCardData | null>(
    null
  );

const isTrackingActive =
  currentTrack !== null &&
  !currentTrack.completedAt;

const hospesBannerMessage =
  getHospesMessage({
    screen: "expedition",
    experience: expedition,
    timeline:
      currentTrack?.timeline ?? [],
  });


  const handleShareAdventureStart = () => {
    };

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", padding: Theme.Space.lg }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
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
        
        <button
          onClick={() => navigate("/explorer")}
          style={{ background: "none", border: "none", color: "#A0A0A0", fontSize: "14px", cursor: "pointer", marginBottom: Theme.Space.md, padding: 0 }}
        >
          ← Volver a explorar
        </button>

        <div style={{ backgroundColor: "#161616", color: "#FFFFFF", borderRadius: "24px", padding: Theme.Space.lg, boxShadow: Theme.Shadows.card, boxSizing: "border-box" }}>
          <span style={{ backgroundColor: Theme.Colors.primary, color: "#fff", fontSize: "13px", fontWeight: 700, padding: "6px 16px", borderRadius: Theme.Radius.pill, display: "inline-block" }}>
            🌎 Expedición
          </span>

          <h1 style={{ margin: "16px 0 12px", color: "#FFFFFF", fontSize: "32px", fontWeight: 800 }}>
            {expedition.title}
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: Theme.Space.sm, margin: "16px 0", fontSize: "14px", color: "#A0A0A0" }}>
            <div>📍 {expedition.city}</div>
            <div>📏 {expedition.distance}</div>
            <div>🚗 Taxi: {expedition.driveTime}</div>
            <div>🚶 Caminando: {expedition.walkTime}</div>
            <div>⏳ {expedition.duration}</div>
            <div>💵 {expedition.price}</div>
            <div>⭐ {difficultyLabels[expedition.difficulty] || expedition.difficulty}</div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "20px 0" }} />

         
<HospesBanner
  message={{
    ...hospesBannerMessage,
    action: undefined,
  }}
/>

          <ExpeditionMap 
            expedition={expedition} 
            track={currentTrack}
            onSelectShare={(data) => {
              setActiveMemory(data);
              setShareOpen(true);
            }}
          />
          
          {isTrackingActive ? (
            <div style={{ marginTop: "20px" }}>
<TrackingPanel
    experienceId={expedition.experienceId}
    track={currentTrack}
    onUpdate={() => {}}
/>
          </div>
          ) : (
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => {
  if (!navigator.geolocation) {
    console.error(
      "Geolocalización no disponible."
    );

    return;
  }

  startWalking(expedition);
}}
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  border: "none",
                  backgroundColor: Theme.Colors.primary,
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  width: "100%",
                  boxShadow: "0 4px 14px rgba(255, 0, 255, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <button
  onClick={() => {
    if (!navigator.geolocation) {
      console.error("Geolocalización no disponible.");
      return;
    }

    startWalking(expedition);
  }}
  style={{
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    backgroundColor: Theme.Colors.primary,
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 4px 14px rgba(255,0,255,1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  }}
>
  <span>🧭</span>
  Comenzar Línea de Exploración
</button>
              </button>

              <button
                onClick={handleShareAdventureStart}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: `1px solid ${Theme.Colors.primary}`,
                  backgroundColor: "rgba(255,0,255,0.04)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <span>✨</span> Compartir
              </button>
            </div>
          )}
        </div>
      </div>

      {shareOpen && activeMemory && (
        <MemoryPreviewModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
         memoryData={activeMemory}
          experienceContext={{
            experienceId: expedition.experienceId,
            slug: expedition.slug,
            title: expedition.title,
            city: expedition.city,
             type: expedition.type
        }}
        mapContext={{
          center: [
            expedition.latitude || -12.06513,
            expedition.longitude || -75.20486
          ],
          // ✅ CORREGIDO: Tipado explícito (item: TimelineItem) para eliminar los errores 7006 de any
          path: currentTrack
            ? currentTrack.timeline
                .filter((item: TimelineItem) => item.type !== "memory")
                .map((item: TimelineItem) => [item.lat, item.lng] as [number, number])
            : [],
            
          // ✅ CORREGIDO: Tipado explícito (item: TimelineItem) para eliminar los errores 7006 de any
          memories: currentTrack
            ? currentTrack.timeline.filter(
                (item: TimelineItem) => item.type === "memory"
              )
            : [],
        }}
      />
    )}
  </div>
);
}

export default Expedition;
