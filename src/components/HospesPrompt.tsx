import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { moods } from "../data/moods";
import { getRecommendationOpener } from "../hospes/dialog";
import { Theme } from "../styles/theme";
// CONEXIÓN SPRINT 1: Importamos el gancho del viaje y el catálogo para buscar la recomendación
import { useJourney } from "../context/JourneyContext";
import { catalog } from "../data/catalog";

function HospesPrompt() {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null); // ◄ Control aislado de hover individual
  const navigate = useNavigate();
  
  // Inicializamos el gatillo del paseo activo
  const { startWalking } = useJourney();

  const handleStartHospesJourney = () => {
    // Buscamos una experiencia del catálogo que coincida con el estado de ánimo seleccionado
    const recommendedExp = catalog.find(
      (e) => (e as any).category === selectedResponse || e.tags?.includes(selectedResponse || "")
    ) || catalog[0]; // Caída de seguridad por si no encuentra concordancia exacta

    // Disparamos la experiencia directamente en el flujo del paseo
    startWalking(recommendedExp);
  };

  return (
    <div style={{ marginTop: "24px", backgroundColor: "#0A0A0A", padding: "16px", borderRadius: "16px", width: "100%", boxSizing: "border-box" }}>
      {!selectedResponse && (
        <>
          <p
            style={{
              fontSize: "14px",
              color: "#A0A0A0", // Gris secundario premium
              marginBottom: "16px",
              textAlign: "center", // Centrado sutil para acompañar el flujo de bienvenida
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              width: "100%",
              margin: "0 0 16px 0"
            }}
          >
            ¿Qué te provoca ahora?
          </p>

          {/* ◄ CONTENEDOR LIMPIO: Se eliminaron TODOS los eventos de hover y transformaciones colectivas */}
          <div
            style={{ 
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center", // Centra las píldoras estéticamente en la pantalla principal
              gap: "12px", // ◄ Espaciado real de 12px para que dejen de verse como una sola barra unificada
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            {moods.map((mood, index) => {
              const isCurrentHovered = hoveredIndex === index; // ◄ Valida si este botón específico tiene el mouse encima

              return (
                <button
                  key={mood.id}
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que interfiera con rutas superiores
                    setSelectedResponse(mood.id);
                  }}
                  onMouseEnter={() => setHoveredIndex(index)} // ◄ Enciende el hover únicamente para este índice
                  onMouseLeave={() => setHoveredIndex(null)}  // ◄ Apaga el hover al salir
                  style={{
                    padding: "10px 18px", // ◄ Incrementamos el grosor para que no se vean delgados ni aplastados
                    borderRadius: "24px", // Píldora premium redondeada
                    border: `1px solid ${Theme.Colors.primary}`, // Línea magenta divisoria
                    // Highlight de fondo individual controlado matemáticamente
                    backgroundColor: isCurrentHovered ? "rgba(255, 0, 122, 0.18)" : "rgba(255, 0, 122, 0.03)",
                    color: "#FFFFFF", 
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    // ◄ ANIMACIÓN INDIVIDUALIZADA: Solo se mueve la píldora activa, el resto de la interfaz queda estática
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isCurrentHovered ? "translateY(-4px)" : "translateY(0px)",
                    boxShadow: isCurrentHovered ? "0 6px 20px rgba(255, 0, 122, 0.4)" : "none",
                    boxSizing: "border-box"
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{mood.icon}</span> 
                  <span>{mood.title}</span>
                </button>
              );
            })}
            
            {/* Botón interactivo secundario para ir a la sección Hospes */}
            <button
              onClick={() => navigate("/hospes")}
              style={{
                padding: "10px 16px",
                borderRadius: "24px",
                border: "1px dashed rgba(255,255,255,0.2)",
                backgroundColor: "transparent",
                color: "#A0A0A0",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = Theme.Colors.primary;
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "#A0A0A0";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Ver más opciones 🔍
            </button>
          </div>
        </>
      )}

      {selectedResponse && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#161616", // Fondo de tarjeta gris de alta fidelidad unificado
            borderRadius: "16px",
            borderLeft: `4px solid ${Theme.Colors.primary}`, // Línea de acento magenta de Hospes
            fontSize: "14px",
            color: "#FFFFFF",
            boxSizing: "border-box",
            marginTop: "12px"
          }}
        >
          <span style={{ 
            color: Theme.Colors.primary, 
            fontWeight: 700, 
            fontSize: "12px", 
            letterSpacing: "1.5px", 
            textTransform: "uppercase",
            display: "block",
            marginBottom: "6px"
          }}>
            🤖 Hospes dice:
          </span>
          
          <p style={{ margin: "0 0 16px 0", color: "#A0A0A0", lineHeight: "1.5" }}>
            {getRecommendationOpener()}
          </p>

          <button
            onClick={handleStartHospesJourney}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: Theme.Colors.primary,
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "transform 0.1s ease",
              boxShadow: "0 4px 12px rgba(255, 0, 122, 0.3)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Iniciar este plan ahora →
          </button>
        </div>
      )}
    </div>
  );
}

export default HospesPrompt;
