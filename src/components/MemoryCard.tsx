import { Theme } from "../styles/theme";
import { MiniMap } from "./maps/MiniMap";
import MemoryMapCanvas from "./sharing/MemoryMapCanvas";
import logo from "../assets/placeholders/logo-iguide.png";
import type { MemoryCardData } from "../types/memoryCard";

// Diccionario estático de Slogans e Invitaciones Emocionales de I.GUIDE por categoría
const EMOTIONAL_MANIFESTO: { [key: string]: { slogan: string; phrase: string } } = {
  adventure: { slogan: "FEEL THE CITY", phrase: "Conquista paisajes que recordarás toda la vida." },
  gastronomy: { slogan: "FEEL THE CITY", phrase: "Saborea la ciudad como un verdadero local." },
  photography: { slogan: "FEEL THE CITY", phrase: "Cada rincón merece una fotografía." },
  nightlife: { slogan: "FEEL THE CITY", phrase: "Cuando cae la noche, la ciudad despierta." },
  backpacker: { slogan: "FEEL THE CITY", phrase: "Viaja ligero. Vive más." },
  family: { slogan: "FEEL THE CITY", phrase: "Los mejores recuerdos se construyen juntos." },
  couples: { slogan: "FEEL THE CITY", phrase: "Cada lugar es mejor cuando se comparte." },
  culture: { slogan: "FEEL THE CITY", phrase: "Cada tradición cuenta una historia." },
  default: { slogan: "FEEL THE CITY", phrase: "Explora la esencia oculta de la ciudad." }
};


type Props = {
  data: MemoryCardData;
  onShare: () => void;
  onDownload?: () => void;
};

function MemoryCard({ data, onShare, onDownload }: Props) {
  const hasPhoto = !!data.photo;

  // Extraer el manifiesto emocional basado en la categoría pre-mapeada
  const interestKey = data.primaryInterest || "default";
  const categoryMeta = EMOTIONAL_MANIFESTO[interestKey] || EMOTIONAL_MANIFESTO["default"];

  // El formateo estricto ya viene computado en strings limpios desde el motor o stats
  const formattedDistance = `${data.stats.totalDistanceKm.toFixed(2)} km`;

  // Formateador express nativo en render para la duración
  const hours = Math.floor(data.stats.durationSeconds / 3600);
  const minutes = Math.floor((data.stats.durationSeconds % 3600) / 60);
  const seconds = data.stats.durationSeconds % 60;
  const pad = (num: number) => String(num).padStart(2, "0");
  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <div
      style={{
        borderRadius: "24px",
        overflow: "hidden",
        backgroundColor: "#161616",
        backgroundImage: hasPhoto ? `url(${data.photo})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        width: "min(86vw, 330px)",
        minHeight: "560px",
        height: "auto",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255, 255, 255, 0.04)"
      }}
    >
      {/* SI NO HAY FOTO: Canvas vectorial inyectado dinámicamente de fondo */}
      {!hasPhoto && data.mapBackground && (
        <MemoryMapCanvas
          center={data.mapBackground.center}
          path={data.mapBackground.path}
          memories={data.mapBackground.memories}
        />
      )}

      {/* Capa cinemática multinivel para protección tipográfica */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.8) 100%)",
        zIndex: 1
      }} />

      {/* RENDERIZADO VISUAL PURO DE DATOS PRECALCULADOS */}
<div
  style={{
    position: "relative",
    minHeight: "560px",
    boxSizing: "border-box",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "16px",
    color: "#FFFFFF",
    zIndex: 2,
  }}
>
       {/* Header Superior */}
<div>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "9px",
      marginBottom: "6px",
    }}
  >
    <img
      src={logo}
      alt="I.GUIDE"
      style={{
        width: "28px",
        height: "28px",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />

    <div>
      <span
        style={{
          display: "block",
          fontSize: "10px",
          fontWeight: 800,
          color: Theme.Colors.primary,
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {categoryMeta.slogan}
      </span>

      <h2
        style={{
          margin: "1px 0 0",
          fontSize: "18px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
        }}
      >
        {data.title}
      </h2>
    </div>
  </div>
          {data.placeLabel && (
  <p
    style={{
      margin: "2px 0",
      fontSize: "11px",
      opacity: 0.75
    }}
  >
    📍 {data.placeLabel}
  </p>
)}
          <p style={{ margin: 0, fontSize: "11px", opacity: 0.6 }}>{data.city} · {data.date}</p>
        </div>

        {/* Crónica Urbana Central */}
        <div style={{ margin: "auto 0", padding: "8px 0" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "13.5px", fontStyle: "italic", fontWeight: 400, lineHeight: "1.4", color: "#F3F4F6" }}>
            "{data.note || "Guardando la esencia del momento en la ruta..."}"
          </p>
          <p
  style={{
    margin: 0,
    fontSize: "11px",
    fontWeight: 600,
    color: "#FFFFFF",
    opacity: 0.82,
    textTransform: "uppercase",
    lineHeight: 1.45,
  }}
>
  ✨ {categoryMeta.phrase}
</p>
        </div>

        {/* Panel Inferior Cuantitativo */}
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "6px",
            backgroundColor: "rgba(255,255,255,0.03)",
            padding: "8px",
            borderRadius: "12px",
            marginBottom: "12px",
            textAlign: "center"
          }}>
            <div>
              <span style={{ fontSize: "8px", opacity: 0.4, textTransform: "uppercase" }}>Distancia</span>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", fontWeight: 700, fontFamily: "monospace" }}>{formattedDistance}</p>
            </div>
            <div>
              <span style={{ fontSize: "8px", opacity: 0.4, textTransform: "uppercase" }}>Tiempo</span>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", fontWeight: 700, fontFamily: "monospace" }}>{formattedTime}</p>
            </div>
            <div>
              <span style={{ fontSize: "8px", opacity: 0.4, textTransform: "uppercase" }}>Hitos</span>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", fontWeight: 700, color: Theme.Colors.primary }}>{data.stats.totalMemories} 🔮</p>
            </div>
          </div>

          {/* MiniMap del Trayecto Acoplado de Forma Reutilizable */}
          {data.waypoints && data.waypoints.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <MiniMap nodes={data.waypoints} height="65px" theme="dark" />
            </div>
          )}

          {/* Branding y Acciones */}
           {/* Contenedor del Logo (Cerrado Correctamente) */}
            

          <div style={{ display: "flex", gap: "6px" }}>
            {onDownload && (
              <button
                onClick={onDownload}
                style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", padding: "6px 10px", borderRadius: "8px", cursor: "pointer" }}
              >
                💾
              </button>
            )}
            <button
              onClick={onShare}
              style={{
                padding: "6px 14px",
                borderRadius: Theme.Radius.pill,
                border: "none",
                backgroundColor: Theme.Colors.primary,
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(255,0,122,0.3)"
              }}
            >
              Compartir
            </button>
          </div>
        </div>
      </div>
    </div>
    );
}

export default MemoryCard;
