import { useNavigate } from "react-router-dom";
import type { Expedition } from "../types/expedition";

type Props = {
  expedition: Expedition;
};

function ExperienceCard({ expedition }: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        background: "#fff",
      }}
    >
      <h2>{expedition.title}</h2>

      <p>📍 {expedition.distance}</p>

      <p>🚗 {expedition.driveTime}</p>

      <button
        onClick={() =>
          navigate(`/expedition/${expedition.slug}`)
        }
      >
        Explorar
      </button>
    </div>
  );
}

export default ExperienceCard;