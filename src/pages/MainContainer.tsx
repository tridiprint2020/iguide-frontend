import { useJourney } from "../context/JourneyContext";
import Home from "./Home"; 
// CORRECCIÓN CLAVE: Se cambia "journey" por "Journey" con J mayúscula para calzar con tus carpetas reales
import { WalkingView } from "../components/journey/WalkingView";
import { CameraView } from "../components/journey/CameraView";
import { PointSavedView } from "../components/journey/PointSavedView";

export const MainContainer: React.FC = () => {
  const { journey } = useJourney();

  switch (journey.state) {
    case "IDLE":
      return <Home />;
    case "WALKING":
      return <WalkingView />;
    case "CAMERA_OPEN":
      return <CameraView />;
    case "POINT_SAVED":
      return <PointSavedView />;
    default:
      return <Home />;
  }
};