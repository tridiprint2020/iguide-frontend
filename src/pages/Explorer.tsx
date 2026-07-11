import { expeditions } from "../data/expeditions";
import ExperienceCard from "../components/ExperienceCard";

function Explorer() {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "auto",
        padding: "30px",
      }}
    >
      <h1>Explora Huancayo</h1>

      {expeditions.map((expedition) => (
        <ExperienceCard
          key={expedition.id}
          expedition={expedition}
        />
      ))}
    </div>
  );
}

export default Explorer;