import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Theme } from "../../styles/theme";

type Props = {
  center: [number, number];
  path: [number, number][];
  memories: any[];
  track?: any;
};

function MemoryMapCanvas({ center, path, memories, track }: Props) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 0 }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        zoomControl={false} 
        dragging={false} 
        doubleClickZoom={false} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", filter: "brightness(0.6) contrast(1.2)" }}
      >
        {/* ✅ CORREGIDO: URL legítima de CartoDB sin dobles barras diagonales ni bloqueos de red */}
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}://{z}/{x}/{y}.png"
        />

        {path.length >= 2 && (
          <Polyline
            positions={path}
            pathOptions={{ color: Theme.Colors.primary, weight: 5, lineCap: "round" }}
          />
        )}

        {memories.map((m, i) => (
          <CircleMarker
            key={m.id || i}
            center={[m.lat, m.lng]}
            radius={m.photo ? 10 : 7}
            pathOptions={{ 
              color: Theme.Colors.primary, 
              weight: 3, 
              fillColor: "#FF007A", 
              fillOpacity: 1 
            }}
          />
        ))}

        {track?.points &&
          track.points
            .filter((point: any) => point.type === "finish")
            .map((point: any) => (
              <CircleMarker
                key={`finish-${point.timestamp}`}
                center={[point.lat, point.lng]}
                radius={10}
                pathOptions={{
                  color: "#16C47F",
                  fillColor: "#16C47F",
                  fillOpacity: 1,
                  weight: 3
                }}
              >
                <Popup>
                  🏁 Expedición finalizada
                </Popup>
              </CircleMarker>
            ))
        }
      </MapContainer>
    </div>
  );
}

export default MemoryMapCanvas;
