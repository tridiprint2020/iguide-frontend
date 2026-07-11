import PrimaryButton from "./PrimaryButton";
import HospesCard from "./HospesCard";
import { useNavigate } from "react-router-dom";

function Hero() {

  const navigate = useNavigate();
  
  return (
    <div style={{ padding: "40px" }}>
      <h1>Bienvenido Explorador 🚀</h1>
      <h1>🌍 I.GUIDE</h1>

 <h3
        style={{
          color: "#2563EB",
        }}
      >
        Feel the City
      </h3>

<p>Como si fueras de la ciudad desde el primer día.</p>

      <HospesCard />
      <PrimaryButton
       text="Comenzar Expedición"
       onClick={() => navigate("/explorer")}
      />

      </div>
  );
}

export default Hero;