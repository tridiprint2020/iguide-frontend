import { useJourney } from "../../context/JourneyContext";
import MemoryCard from "../MemoryCard";
import ShareDrawer from "../sharing/ShareDrawer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Experience } from "../../types/experience/experience";
import { getJourneyStats } from "../../engine/trackingEngine";
import HospesBanner from "../hospes/HospesBanner";
import { getHospesMessage } from "../../engine/hospesContextEngine";

export default function JourneyCompletedView() {
const {
  journey,
  abandonJourney
} = useJourney();

const navigate = useNavigate();

  const [shareOpen, setShareOpen] = useState(false);
const hospesBannerMessage =
  getHospesMessage({
    screen: "completed",
    experience: journey.experience,
    timeline: journey.timeline,
    rewardXp: 150,
  });
  
  // ❌ ANTES: const stats = journey.experience ? getJourneyStats(journey.experience.experienceId) : null;
  // ✅ DESPUÉS: Cambia la llamada por el puente directo de tracks persistidos
 const stats =
  journey.timeline && journey.startedAt
    ? getJourneyStats(
        journey.timeline,
        journey.startedAt
      )
    : null;


  const lastPhoto = stats?.lastPhoto;
  const lastNote = stats?.lastNote ?? "";
  const activeExperience = journey.experience as Experience;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#090909",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <div>
        <div
  style={{
    color: "#41E28A",
    fontWeight: 700,
    marginBottom: 12,
  }}
>
  ✓ Expedición completada
</div>

<HospesBanner
  message={hospesBannerMessage}
/>

        <h1
          style={{
            color: "white",
            fontSize: 34,
            marginBottom: 10
          }}
        >
          ¡Aventura Finalizada!
        </h1>

        <p
          style={{
            color: "#BBBBBB",
            lineHeight: 1.6,
            marginBottom: 24
          }}
        >
          Tu recorrido quedó guardado.
          Ahora puedes compartirlo completo
          o continuar explorando {activeExperience?.city || "Huancayo"}.
        </p>

        {/* 📊 PANEL DE MÉTRICAS REALES DESACOPLADO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            marginBottom: "24px"
          }}
        >
          <div style={{ backgroundColor: "#141414", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.03)" }}>
            <p style={{ color: "#777777", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase" }}>Hitos</p>
            <h3 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, margin: 0 }}>
              {stats?.totalMemories ?? 0} 🔮
            </h3>
          </div>

          <div style={{ backgroundColor: "#141414", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.03)" }}>
            <p style={{ color: "#777777", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase" }}>Duración</p>
            <h3 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, margin: 0 }}>
              {Math.floor((stats?.durationSeconds ?? 0) / 60)} min ⏳
            </h3>
          </div>

          <div style={{ backgroundColor: "#141414", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.03)" }}>
            <p style={{ color: "#777777", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase" }}>Fotos</p>
            <h3 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, margin: 0 }}>
              {stats?.totalPhotos ?? 0} 📷
            </h3>
          </div>

          <div style={{ backgroundColor: "#141414", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.03)" }}>
            <p style={{ color: "#777777", fontSize: "12px", margin: "0 0 4px 0", textTransform: "uppercase" }}>Notas</p>
            <h3 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, margin: 0 }}>
              {stats?.totalNotes ?? 0} 📝
            </h3>
          </div>
        </div>

        {/* 🏛️ CARD EMOCIONAL ACOPLADO A LA FACHADA UNIFICADA */}
        <MemoryCard
  data={{
    title:
      activeExperience?.title ||
      "Destino",

    placeLabel:
      activeExperience?.title ||
      "Lugar visitado",

    city:
      activeExperience?.city ||
      "Huancayo",

    date:
      new Date().toLocaleDateString(
        "es-PE"
      ),

    photo: lastPhoto,

    note:
      lastNote ||
      "¡Completé mi Línea de Exploración con éxito! 🔮",

    primaryInterest:
      activeExperience?.interests &&
      activeExperience.interests.length > 0
        ? activeExperience.interests[0]
        : undefined,

    lat:
      activeExperience?.latitude,

    lng:
      activeExperience?.longitude,

    waypoints:
      journey.timeline || [],

    stats:
      stats || {
        totalPhotos: 0,
        totalNotes: 0,
        totalMemories: 0,
        totalDistanceKm: 0,
        durationSeconds: 0,
      },

    mapBackground: {
      center: [
        activeExperience?.latitude ?? 0,
        activeExperience?.longitude ?? 0,
      ],

      path: (journey.timeline || [])
        .filter(
          (item) =>
            item.type !== "memory"
        )
        .map(
          (item) =>
            [
              item.lat,
              item.lng,
            ] as [number, number]
        ),

      memories:
        (journey.timeline || []).filter(
          (item) =>
            item.type === "memory"
        ),
    },
  }}
  onShare={() =>
    setShareOpen(true)
  }
/>

        <div
          style={{
            marginTop: 28,
            display: "grid",
            gap: 12
          }}
        >
          <button
            onClick={() => setShareOpen(true)}
            style={{
              height: 54,
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              background: "#FF007A",
              color: "white",
              fontWeight: 700
            }}
          >
            Compartir aventura completa
          </button>

          <button
  onClick={() => {
    abandonJourney();
    navigate("/explorer");
  }}
  style={{
              height: 54,
              borderRadius: 14,
              border: "1px solid #333",
              background: "#111",
              color: "white",
              cursor: "pointer"
            }}
          >
            Volver a explorar
          </button>
        </div>
      </div>

      <ShareDrawer
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onInstagram={() => {}}
        onFacebook={() => {}}
        onThreads={() => {}}
        onTwitter={() => {}}
        onDownload={() => {}}
        onCopyLink={() => {}}
      />
    </div>
  );
}
