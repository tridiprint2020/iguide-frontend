import Hero from "../components/Hero";
import { expeditions } from "../data/expeditions";
import ExperienceCard from "../components/ExperienceCard";

function Home() {
  return <Hero />;
  <h2>⭐ Experiencias recomendadas</h2>

{expeditions.map((expedition) => (
  <ExperienceCard
    key={expedition.id}
    expedition={expedition}
  />
))}
}

export default Home;