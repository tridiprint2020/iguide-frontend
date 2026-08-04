import { useState, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { catalog } from "../data/catalog";
import { loadTrack } from "../engine/trackingEngine";
import type { ExperienceType, Experience } from "../types/experience";
import { Theme } from "../styles/theme";
import type { MemoryCardData } from "../types/memoryCard";
import MemoryPreviewModal from "../components/sharing/MemoryPreviewModal";
import type { TimelineItem } from "../types/tracking/tracking"; // ✅ Importación de tipos oficiales del Core
import { useNavigate } from "react-router-dom";

const typeFilters: { type: ExperienceType; icon: string; label: string }[] = [
  { type: "expedition", icon: "🥾", label: "Expediciones" },
  { type: "restaurant", icon: "🍽", label: "Restaurantes" },
  { type: "cafe", icon: "☕", label: "Cafés" },
  { type: "hotel", icon: "🏨", label: "Hoteles" },
  { type: "museum", icon: "🏛", label: "Museos" },
  { type: "festival", icon: "🎉", label: "Festividades" },
];

function MapPage() {
  const [activeFilters, setActiveFilters] = useState<ExperienceType[]>(["expedition"]);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeMemory, setActiveMemory] = useState<MemoryCardData | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const navigate = useNavigate(); 
  
  const handleFilterClick = (type: ExperienceType) => {
    setActiveFilters((prev) => {
      if (prev.length === 1 && prev.includes(type)) {
        return typeFilters.map((f) => f.type);
      }
      return prev.includes(type) ? prev.filter((t) => t !== type) : [type];
    });
  };

  const visibleExperiences = catalog.filter((e) => activeFilters.includes(e.type));
  const center: [number, number] = [-12.066, -75.21];

  // ✅ VARIABLES DERIVADAS DEL TIMELINE: Una sola consulta unificada para el Modal (Regla 14)
  const currentTrack = selectedExperience
    ? loadTrack(selectedExperience.experienceId)
    : null;

  const currentPath = currentTrack
    ? currentTrack.timeline
        .filter((item: TimelineItem) => item.type !== "memory")
        .map((item: TimelineItem) => [item.lat, item.lng] as [number, number])
    : [];

  const currentMemories = currentTrack
    ? currentTrack.timeline.filter((item: TimelineItem) => item.type === "memory")
    : [];

  return (
    <div style={{ backgroundColor: Theme.Colors.background, minHeight: "100vh", padding: "24px", boxSizing: "border-box" }}>
     
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
      
      <h1 style={{ color: Theme.Colors.text, fontFamily: Theme.Typography.title, marginBottom: "20px", textAlign: "center" }}>
        Mapa del Valle
      </h1>

      <div
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "12px", 
          width: "100%", 
          maxWidth: "960px", 
          margin: "0 auto 24px auto", 
          boxSizing: "border-box"
        }}
      >
        {typeFilters.map((filter) => {
          const isActive = activeFilters.includes(filter.type);
          const [isBtnHovered, setIsBtnHovered] = useState(false);
          return (
            <button
              key={filter.type}
              onClick={() => handleFilterClick(filter.type)}
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => setIsBtnHovered(false)}
              style={{
                padding: "12px 8px",
                borderRadius: "14px",
                border: isActive ? `2px solid ${Theme.Colors.primary}` : "2px solid rgba(255,255,255,0.08)",
                backgroundColor: isActive ? Theme.Colors.primary : "#161616",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isBtnHovered ? "translateY(-3px)" : "translateY(0px)",
                boxShadow: isBtnHovered ? "0 6px 16px rgba(255, 0, 122, 0.35)" : "none"
              }}
            >
              <span style={{ fontSize: "16px" }}>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ height: "65vh", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {visibleExperiences.map((experience) => (
            <Marker key={experience.experienceId} position={[experience.latitude, experience.longitude]}>
              <Popup>
                <div style={{ padding: "4px", textAlign: "center" }}>
                  <strong style={{ display: "block", marginBottom: "6px", color: "#000" }}>{experience.title}</strong>
                  <button
                    onClick={() => {
                        const localData: MemoryCardData = {
                        title: experience.title, // ◄ 1. Campo Requerido
                        placeLabel: experience.title,
                        city: experience.city,
                        date: "Disponible Ahora",
                        note: experience.description,
                        photo: (experience as any).photo || undefined,
                        primaryInterest: experience.interests && experience.interests.length > 0 
                          ? experience.interests[0] 
                          : undefined,
                        center: [experience.latitude, experience.longitude], // ◄ 2. Campo Requerido
                        path: [], // ◄ 3. Campo Requerido
                        stats: {
                          totalPhotos: 0,
                          totalNotes: 0,
                          totalMemories: 0,
                          totalDistanceKm: 0,
                          durationSeconds: 0,
                        }, // ◄ 4. Campo Requerido
                      };
                      setSelectedExperience(experience);
                      setActiveMemory(localData);
                      setShareOpen(true);

                    }}
                    style={{
                      backgroundColor: Theme.Colors.primary,
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Ver detalles del local ↗
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ✅ REGLA 13 Y 14: Renderizado de recuerdos en el mapa global leyendo del Timeline unificado */}
          {visibleExperiences.map((experience) => {
            const loopTrack = loadTrack(experience.experienceId);
            if (!loopTrack) return null;

            const loopMemories = loopTrack.timeline.filter((item: TimelineItem) => item.type === "memory");

            return loopMemories.map((memory: TimelineItem, mIndex: number) => (
              <Fragment key={memory.id || `global-mem-${mIndex}`}>
                <CircleMarker
                  center={[memory.lat, memory.lng]}
                  radius={10}
                  pathOptions={{ color: "#fff", weight: 2, fillColor: Theme.Colors.primary, fillOpacity: 1 }}
                >
                  <Popup>
                    <div style={{ padding: "4px", textAlign: "center" }}>
                      <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 600, color: "#161616" }}>Recuerdo Guardado</p>
                      <button
                        onClick={() => {
                        const localData: MemoryCardData = {
                        title: experience.title, // ◄ 1. Campo Requerido
                        placeLabel: experience.title,
                        city: experience.city,
                        date: "Disponible Ahora",
                        note: experience.description,
                        photo: (experience as any).photo || undefined,
                        primaryInterest: experience.interests && experience.interests.length > 0 
                          ? experience.interests[0] 
                          : undefined,
                        center: [experience.latitude, experience.longitude], // ◄ 2. Campo Requerido
                        path: [], // ◄ 3. Campo Requerido
                        stats: {
                          totalPhotos: 0,
                          totalNotes: 0,
                          totalMemories: 0,
                          totalDistanceKm: 0,
                          durationSeconds: 0,
                        }, // ◄ 4. Campo Requerido
                      };
                      setSelectedExperience(experience);
                      setActiveMemory(localData);
                      setShareOpen(true);

                        }}
                        style={{
                          backgroundColor: "#FF007A",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Ver tarjeta de recuerdo ↗
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              </Fragment>
            ));
          })}
        </MapContainer>
      </div>

      {/* ✅ CORREGIDO: Inyección atómica libre de la propiedad legada 'points' y 'memories' */}
      <MemoryPreviewModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        memoryData={activeMemory}
        experienceContext={selectedExperience} 
        mapContext={{
          center: selectedExperience ? [selectedExperience.latitude, selectedExperience.longitude] : center,
          path: currentPath,
          memories: currentMemories
        }}
      />
    </div>
  );
}

export default MapPage;
