import { useLocation, useNavigate } from "react-router-dom";
import { useJourney } from "../context/JourneyContext";
import { getDetailReturnPath } from "../engine/navigationPolicy";
export function useAppBack() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetToHome } = useJourney();
  return {
    goHome: () => { resetToHome(); navigate("/"); },
    goBack: () => navigate(getDetailReturnPath(location.state)),
    detailState: { from: location.pathname + location.search },
  };
}
