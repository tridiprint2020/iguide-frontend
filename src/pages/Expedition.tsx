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
import logoIG from "../assets/optimized/logoIG.webp";
import { Route } from "lucide-react";

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


  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", padding: Theme.Space.lg }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* 🏠 BARRA DE NAVEGACIÓN DE ESCAPE (REGLA 22) */}
       <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(255,255,255,.05)",
              color: "#FFF",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
          🏠 Inicio
        </button>
         <img
            src={logoIG}
            alt="I.GUIDE"
            style={{
              width: 68,
              objectFit: "contain",
            }}
          />
            </header>
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
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <TrackingPanel
                experienceId={
                  expedition.experienceId
                }
                track={currentTrack}
                onUpdate={() => {}}
              />
            </div>
          ) : (
            <div
              style={{
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) {
                    console.error(
                      "Geolocalización no disponible."
                    );

                    return;
                  }

                  startWalking(
                    expedition
                  );
                }}
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "66px",
                  overflow: "hidden",
                  display: "grid",
                  gridTemplateColumns:
                    "48px minmax(0, 1fr)",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 16px",
                  borderRadius: "18px",
                  border:
                    "1px solid rgba(255,255,255,0.14)",
                  background:
                    "linear-gradient(145deg, #FF3DE8 0%, #D4008D 58%, #7D006E 100%)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow:
                    "0 14px 32px rgba(255,0,184,0.30), 0 0 20px rgba(255,0,255,0.16)",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "46px",
                    height: "46px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "15px",
                    background:
                      "rgba(8,9,18,0.24)",
                    border:
                      "1px solid rgba(255,255,255,0.18)",
                    boxShadow:
                      "inset 0 0 16px rgba(255,255,255,0.06)",
                  }}
                >
                  <Route
                    size={25}
                    strokeWidth={1.8}
                  />
                </span>

                <span
                  style={{
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "15px",
                      lineHeight: 1.15,
                      fontWeight: 900,
                    }}
                  >
                    Comenzar exploración
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color:
                        "rgba(255,255,255,0.76)",
                      fontSize: "10px",
                      fontWeight: 650,
                    }}
                  >
                    Registrar ruta, recuerdos y llegada
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
     

      {shareOpen && activeMemory && (
        <MemoryPreviewModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
         memoryData={activeMemory}
          experienceContext={expedition}
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