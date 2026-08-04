import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Inyectado para control de subventanas
import MemoryCard from "../MemoryCard";
import ShareDrawer from "./ShareDrawer";
import type { MemoryCardData } from "../../types/memoryCard";
import { shareEngine } from "../../engine/shareEngine";
import { Theme } from "../../styles/theme";
import { useJourney } from "../../context/JourneyContext"; // ✅ Conexión al estado del viaje activo

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memoryData: MemoryCardData | null;
  experienceContext: any; // ✅ Recibe el objeto Experience crudo para inyectar al motor de rutas
  mapContext: {
    center: [number, number];
    path: [number, number][];
    memories: any[];
  };
};

function MemoryPreviewModal({ isOpen, onClose, memoryData, experienceContext, mapContext }: Props) {
  const navigate = useNavigate();
  const { startWalking } = useJourney(); // ✅ Despachador de expediciones
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  if (!isOpen || !memoryData) return null;

  const handleSocialShare = () => {
    shareEngine.shareMemory(memoryData);
  };

  const handleCopyLink = () => {
    shareEngine.copyShareLink(memoryData);
  };

  const handleDownload = () => {
    shareEngine.downloadImage(memoryData, null);
  };

  const handleStartActiveJourney = () => {
    onClose();
    if (experienceContext && experienceContext.slug) {
      // ✅ 1. Consume la función declarada para activar el viaje en el estado global
      startWalking(experienceContext);
      
      // ✅ 2. Redirección precisa a la ficha detallada (ej: /expedition/girasoles)
      navigate(`/expedition/${experienceContext.slug}`); 
    } else {
      // Caída de seguridad por si no se detecta el contexto del local
      navigate("/explorer");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(6, 6, 6, 0.95)",
        backdropFilter: "blur(16px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        padding: "24px",
        boxSizing: "border-box",
        overflowY: "auto"
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: "100%", 
          maxWidth: "330px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          gap: "16px"
        }}
      >
        {/* Cabecera Estable */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ color: "#ffffff", margin: 0, fontSize: "15px", fontWeight: 700, letterSpacing: "0.5px" }}>
            Detalles del Descubrimiento
          </h4>
          <button 
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#A0A0A0",
              fontSize: "14px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Tarjeta Visual de Previsualización */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <MemoryCard
            data={{
              ...memoryData,
              mapBackground: mapContext
            }}
            onShare={handleSocialShare}
          />
        </div>

        {/* Panel de Control Inferior */}
        <div 
          style={{ 
            width: "100%", 
            backgroundColor: "#161616", 
            padding: "16px", 
            borderRadius: "24px", 
            border: "1px solid rgba(255,255,255,0.05)", 
            boxSizing: "border-box" 
          }}
        >
          {/* 🏃‍♂️ BOTÓN ENCABEZADO: ¡VAMOS! ENRUTA DIRECTO AL RECORRIDO */}
          <button
            onClick={handleStartActiveJourney}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: Theme.Colors.primary,
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              cursor: "pointer",
              marginBottom: "16px",
              boxShadow: isBtnHovered ? "0 6px 16px rgba(255, 0, 122, 0.45)" : "none",
              transition: "all 0.2s ease",
              transform: isBtnHovered ? "translateY(-2px)" : "translateY(0px)"
            }}
          >
            🏃‍♂️ ¡VAMOS! Iniciar Recorrido
          </button>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", width: "100%" }}>
            <p style={{ color: "#A0A0A0", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px 0", textAlign: "center" }}>
              O comparte este descubrimiento
            </p>
            
            <ShareDrawer
              open={true}
              onClose={onClose}
              onInstagram={handleSocialShare}
              onFacebook={handleSocialShare}
              onThreads={handleSocialShare}
              onTwitter={handleSocialShare}
              onDownload={handleDownload}
              onCopyLink={handleCopyLink}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryPreviewModal;
