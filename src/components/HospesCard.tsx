import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { moods } from "../data/moods";
import { getRecommendationOpener } from "../hospes/dialog";
import { Theme } from "../styles/theme";

function HospesPrompt() {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ marginTop: Theme.Space.sm }}>
      {!selectedResponse && (
        <>
          <p
            style={{
              fontSize: "16px",
              color: Theme.Colors.textSoft,
              marginBottom: "8px",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "center",
              width: "100%",
              maxWidth: "500px",
              boxSizing: "border-box"
            }}
          >
            ¿Qué te provoca ahora?
          </p>

          <div
            onClick={() => navigate("/hospes")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
            display: "flex",
            flexWrap: "wrap",
            textAlign: "center",
            gap: "8px",             
            cursor: "pointer",
            transition: ".25s",
            boxShadow: isHovered ? Theme.Shadows.hover : "none",
            transform: isHovered ? "translateY(-4px)" : "translateY(0px)"
            
            }}
          >
                        
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedResponse(mood.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: Theme.Radius.pill,
                  border: `1px solid ${Theme.Colors.primary}`,
                  backgroundColor: "transparent",
                  color: Theme.Colors.primary,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {mood.icon} {mood.title}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedResponse && (
        <div
          style={{
            fontSize: "14px",
            color: Theme.Colors.text,
          }}
        >
          <p>{getRecommendationOpener()}</p>

          <button
            onClick={() => navigate(`/categoria/${selectedResponse}`)}
            style={{
              marginTop: "8px",
              padding: "10px 16px",
              borderRadius: Theme.Radius.medium,
              border: "none",
              backgroundColor: Theme.Colors.primary,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ver sugerencias →
          </button>
        </div>
      )}
    </div>
  );
}

export default HospesPrompt;