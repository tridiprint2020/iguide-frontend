import { useNavigate } from "react-router-dom";
import { moods } from "../data/moods";
import { countExperiencesByTag } from "../engine/experienceEngine";
import { Theme } from "../styles/theme";

function MoodCarousel() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: Theme.Space.sm }}>
        <h2 style={{ color: Theme.Colors.text, fontSize: "18px", margin: 0 }}>
          ¿Cómo quieres <span style={{ color: Theme.Colors.primary }}>sentirte</span> hoy?
        </h2>
        <span style={{ color: Theme.Colors.primary, fontSize: "13px", cursor: "pointer" }} onClick={() => navigate("/explorer")}>
          Ver todas las experiencias →
        </span>
      </div>

      <div style={{ display: "flex", gap: Theme.Space.sm, overflowX: "auto", paddingBottom: "8px" }}>
        {moods.map((mood) => {
          const count = countExperiencesByTag(mood.tag);
          return (
            <div
              key={mood.id}
              className="ig-hover"
              onClick={() => navigate(`/categoria/${mood.id}`)}
              style={{
                minWidth: "180px",
                backgroundColor: Theme.Colors.surface,
                borderRadius: Theme.Radius.medium,
                padding: Theme.Space.md,
                cursor: "pointer",
                border: `1px solid ${Theme.Colors.textSoft}22`,
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: Theme.Colors.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: Theme.Space.sm,
                }}
              >
                {mood.icon}
              </div>
              <h3 style={{ margin: "0 0 4px", color: Theme.Colors.text, fontSize: "15px" }}>{mood.title}</h3>
              <p style={{ margin: 0, color: Theme.Colors.textSoft, fontSize: "12px" }}>{mood.subtitle}</p>
              <span style={{ display: "block", marginTop: "8px", fontSize: "11px", color: Theme.Colors.primary }}>
                {count} {count === 1 ? "experiencia" : "experiencias"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MoodCarousel;