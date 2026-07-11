import { useParams } from "react-router-dom";
import { expeditions } from "../data/expeditions";

function Expedition() {
  const { slug } = useParams();

  const expedition = expeditions.find((e) => e.slug === slug);

  if (!expedition) {
    return <h1>Expedición no encontrada.</h1>;
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1>🌎 Expedición</h1>

      <h2>{expedition.title}</h2>

      <p>📍 Ciudad: {expedition.city}</p>
      <p>📏 Distancia: {expedition.distance}</p>
      <p>🚗 Taxi: {expedition.driveTime}</p>
      <p>🚶 Caminando: {expedition.walkTime}</p>
      <p>⏳ Duración: {expedition.duration}</p>
      <p>💵 Precio: {expedition.price}</p>
      <p>⭐ Dificultad: {expedition.difficulty}</p>

      <hr />

      <h3>🤖 Hospes dice:</h3>
      <p>{expedition.hospes}</p>
    </div>
  );
}

export default Expedition;