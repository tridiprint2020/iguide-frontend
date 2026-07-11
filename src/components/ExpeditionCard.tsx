import type { Expedition } from "../types/expedition";
import { useNavigate } from "react-router-dom";

type Props = {
  expedition: Expedition;
};

function ExperienceCard({ expedition }: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "25px",
        background: "white",
        boxShadow: "0 6px 18px rgba(0,0,0,.08)",
      }}
    >
      <img
        src={expedition.image}
        alt={expedition.title}
        style={{
          width: "100%",
          height: "220px",
          objectFit: "cover",
        }}
      />

      <div style={{ padding: "20px" }}>
        <h2>{expedition.title}</h2>

        <p>📍 {expedition.city}</p>

        <p>⏳ {expedition.duration}</p>

        <p>🚗 {expedition.driveTime}</p>

        <p>⭐ {expedition.difficulty}</p>

        <p>
          <strong>🤖 Hospes:</strong>
        </p>

        <p>{expedition.hospes}</p>

        <button
          onClick={() =>
            navigate(`/expedition/${expedition.slug}`)
          }
        >
          Explorar
        </button>
      </div>
    </div>
  );
}

export default ExperienceCard;