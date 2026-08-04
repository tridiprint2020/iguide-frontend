import { useNavigate } from "react-router-dom";
import type { HospesDecision } from "../types/hospesBrain";
import { Theme } from "../styles/theme";

type Props = {
  decision: HospesDecision;
};

function HospesActionCard({ decision }: Props) {
  const navigate = useNavigate();

  const handleAction = () => {
    switch (decision.action.type) {
      case "open-experience":
        navigate(`/expedition/${decision.action.target}`);
        break;
      case "open-category":
        navigate(`/categoria/${decision.action.target}`);
        break;
      case "open-itinerary":
        navigate("/itinerario");
        break;
      case "open-map":
        navigate("/mapa");
        break;
    }
  };

  return (
    <div
      style={{
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radius.medium,
        paddingLeft: "40px", //Theme.Space.md,
        color: Theme.Colors.text,
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        width: "100%",
        maxWidth: "300px",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ margin: "0 0 6px 0", color: Theme.Colors.primary,textAlign: "center", width: "100%", fontSize: "16px" }}>{decision.title}</h3>
      <p style={{ margin: "0 0 16px 0", fontSize: "14px",textAlign: "center", width: "100%", color: Theme.Colors.textSoft }}>{decision.message}</p>
      <button
        className="ig-hover"
        onClick={handleAction}
        style={{
          padding: "8px 20px",
          borderRadius: "Theme.Radius.medium",
          border: "none",
          backgroundColor: Theme.Colors.primary,
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "16px 0 4px 0",
          width: "fit-content",
          
        }}
      >
       Ver el plan →
      </button>
    </div>
  );
}

export default HospesActionCard;