import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Experience } from "../types/experience";
import { Theme } from "../styles/theme";
import type { ExpeditionTrack, TimelineItem } from "../types/tracking/tracking";
import { getGeoLabel } from "../engine/geoLabelEngine";
import { currentCity } from "../data/currentCity";
import type { MemoryCardData } from "../types/memoryCard";
import { getJourneyStats } from "../engine/trackingEngine"; 
import  { useJourney } from "../context/JourneyContext";

type Props = {
  expedition: Experience;
  track: ExpeditionTrack | null;
  onSelectShare: (memoryData: MemoryCardData) => void;
};

function ExpeditionMap({ expedition, track: propTrack, onSelectShare }: Props) {
  const center: [number, number] = [expedition.latitude, expedition.longitude];
  
  // 🚨 EXTRAEMOS EL TIMELINE EN MEMORIA: Escucha activa de las coordenadas del GPS
  const { journey } = useJourney();

  // 🔄 EVALUACIÓN: Si es historial usamos propTrack, si estamos caminando usamos el contexto vivo
  const activeTimeline: TimelineItem[] = propTrack 
    ? (propTrack.timeline || []) 
    : (journey.timeline || []);

  const activeStartedAt = propTrack ? propTrack.startedAt : journey.startedAt;

  // ✅ UI Derivada pura leyendo del Timeline dinámico unificado
  const path: [number, number][] = activeTimeline
    .filter(
      (p) =>
        p.type === "start" ||
        p.type === "walk" ||
        p.type === "finish"
    )
    .map((p) => [p.lat, p.lng] as [number, number]);

  // 📊 Estadísticas calculadas en caliente para las tarjetas de recuerdos
  const stats = activeTimeline.length > 0
    ? getJourneyStats(activeTimeline, activeStartedAt || Date.now())
    : {
        totalPhotos: 0,
        totalNotes: 0,
        totalMemories: 0,
        totalDistanceKm: 0,
        durationSeconds: 0,
      };

  const { durationSeconds, totalDistanceKm, totalMemories, totalPhotos, totalNotes } = stats;

  return (
    <div style={{ marginTop: Theme.Space.md, height: "380px", width: "100%", borderRadius: "16px", overflow: "hidden" }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={center} />

        {/* ✅ Renderizado de todos los hitos geográficos interactivos desde activeTimeline */}
        {activeTimeline.map((p, index) => {          
          
          // 🔵 Si es un punto ordinario de caminata (Puntitos sobre la línea)
          if (p.type === "walk") {
            return (
              <CircleMarker
                key={`walk-node-${p.id || index}`}
                center={[p.lat, p.lng]}
                radius={4}
                pathOptions={{
                  color: "#FF00FF ",
                  fillColor: "#FF00FF ",
                  fillOpacity: 1,
                  weight: 1
                }}
              />
            );
          }

          // 📸 Si es un hito de memoria multimedia (PUNTOS MAGENTA EN EL INSTANTE)
          if (p.type === "memory") {
            return (
              <CircleMarker
                key={`memory-node-${p.id || index}`}
                center={[p.lat, p.lng]}
                radius={12}
                pathOptions={{ 
                  color: Theme.Colors.primary, 
                  weight: 4, 
                  fillColor: "#0A0A0A", 
                  fillOpacity: 0.8 
                }}
              >
                <Popup className="clean-popup">
                  <div style={{ padding: "8px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "#161616" }}>
                      📍 Hito registrado
                    </p>
                    <button
                      onClick={() => {
                        const computedData: MemoryCardData = {
                          photo: p.photo,
                          placeLabel: getGeoLabel(p.lat, p.lng).text,
                          city: currentCity,
                          date: new Date(p.timestamp).toLocaleDateString("es-PE"),
                          note: p.note || "",
                          title: expedition.title,
                          stats: {
                            durationSeconds,
                            totalDistanceKm,
                            totalMemories,
                            totalPhotos, 
                            totalNotes   
                          },
                          center: [p.lat, p.lng],
                          path: path,
                        };
                        onSelectShare(computedData);
                      }}
                      style={{
                        backgroundColor: "#FF00FF",
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
            );
          }

          // 🟣 Si es un nodo de Inicio (start) o Fin (finish)
          const isStart = p.type === "start";
          const color = isStart ? "#FF00FF" : "#41E28A";

          return (
            <CircleMarker
              key={`edge-node-${p.id || index}`}
              center={[p.lat, p.lng]}
              radius={8}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 1,
                weight: 2
              }}
            >
              <Popup>
                <div style={{ width: 180, textAlign: "center" }}>
                  <h4 style={{ margin: "4px 0 10px 0", fontSize: "14px", fontWeight: 700, color: "#161616" }}>
                    {isStart ? "🚀 Inicio" : "🏁 Final"}
                  </h4>
                  <button
                    style={{
                      width: "100%",
                      height: 34,
                      background: "#FF00FF",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      onSelectShare({
                        photo: undefined,
                        placeLabel: expedition.title,
                        city: expedition.city,
                        date: new Date(p.timestamp).toLocaleDateString("es-PE"),
                        note: isStart
                          ? "Comienza mi aventura con I.GUIDE 🚀"
                          : "Finalicé esta aventura con I.GUIDE 🏁",
                        title: "",
                        stats: {
                          durationSeconds,
                          totalDistanceKm,
                          totalMemories,
                          totalPhotos,
                          totalNotes
                        },
                        center: [p.lat, p.lng],
                        path: []
                      });
                    }}
                  >
                    Compartir
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* 🗺️ LINEA REACTIVA: Sin 'key' para que redibuje nativamente sin destruir el nodo en el DOM */}
        {path.length >= 2 && (
          <Polyline
            positions={path}
            pathOptions={{
              color: Theme.Colors.primary,
              weight: 5,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default ExpeditionMap;
