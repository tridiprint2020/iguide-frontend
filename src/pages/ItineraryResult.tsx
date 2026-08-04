import { useNavigate } from "react-router-dom";
import type { Experience } from "../types/experience";
import PlaceHighlightCard from "../components/PlaceHighlightCard";
import { Theme } from "../styles/theme";

function ItineraryResult() {
  const navigate = useNavigate();
  const stored = sessionStorage.getItem("iguide_itinerary_result");
  const route: Experience[] = stored ? JSON.parse(stored) : [];

  if (route.length === 0) {
    return (
      <div style={{ padding: Theme.Space.xl, textAlign: "center" }}>
        <h1>No hay itinerario generado todavía.</h1>
        <button onClick={() => navigate("/itinerario")}>Crear uno →</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: Theme.Colors.background, minHeight: "100vh", padding: Theme.Space.lg }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: Theme.Colors.text, fontFamily: Theme.Typography.title, marginBottom: Theme.Space.sm }}>
           Hospes preparó tu expedición
        </h1>
        <p style={{ color: Theme.Colors.textSoft, marginBottom: Theme.Space.lg }}>
          Esta es la ruta que armé especialmente para ti, según tus respuestas.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: Theme.Space.sm }}>
          {route.map((expedition, index) => (
            <div key={expedition.experienceId}>
              <span style={{ color: Theme.Colors.primary, fontSize: "13px", fontWeight: 700 }}>
                Parada {index + 1}
              </span>
              <PlaceHighlightCard expedition={expedition} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ItineraryResult;