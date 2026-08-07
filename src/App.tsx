import {
  useEffect,
} from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Expedition from "./pages/Expedition";
import Explorer from "./pages/Explorer";
import ItineraryPage from "./pages/ItineraryPage";
import Hospes from "./pages/Hospes";
import MapPage from "./pages/MapPage";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import {
  MainContainer,
} from "./pages/MainContainer";

import {
  WalkingView,
} from "./components/journey/WalkingView";

import ActiveJourneyBubble from "./components/journey/ActiveJourneyBubble";

import {
  useJourney,
} from "./context/JourneyContext";

/**
 * Coordina únicamente efectos de UI globales del Journey.
 *
 * JourneyContext conserva la lógica de dominio y persistencia.
 * App decide cuándo navegar a la pantalla de cierre y cuándo
 * mostrar la burbuja de misión activa.
 */
function JourneyUiCoordinator() {
  const {
    journey,
  } = useJourney();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  useEffect(() => {
    if (
      journey.screen !== "completed" ||
      location.pathname === "/journey"
    ) {
      return;
    }

    navigate(
      "/journey",
      {
        replace: false,
      }
    );
  }, [
    journey.screen,
    location.pathname,
    navigate,
  ]);

  /*
   * La misión es global: la burbuja permanece visible al
   * navegar por la app, incluso dentro de la ficha del lugar.
   * Se oculta solamente en /journey, donde ya está abierta la
   * interfaz completa del recorrido.
   */
  const showGlobalBubble =
    journey.state === "WALKING" &&
    journey.screen === "walking" &&
    location.pathname !== "/journey";

  return showGlobalBubble
    ? <ActiveJourneyBubble />
    : null;
}

function App() {
  return (
    <>
      <JourneyUiCoordinator />

      <Routes>
        <Route
          path="/"
          element={<MainContainer />}
        />

        <Route
          path="/journey"
          element={<WalkingView />}
        />

        <Route
          path="/expedition/:slug"
          element={<Expedition />}
        />

        <Route
          path="/perfil"
          element={<Profile />}
        />

        <Route
          path="/explorer"
          element={<Explorer />}
        />

        <Route
          path="/favoritos"
          element={<Favorites />}
        />

        <Route
          path="/itinerario"
          element={<ItineraryPage />}
        />

        <Route
          path="/hospes"
          element={<Hospes />}
        />

        <Route
          path="/mapa"
          element={<MapPage />}
        />

        {/* Compatibilidad con enlaces antiguos. */}
        <Route
          path="/map"
          element={
            <Navigate
              to="/mapa"
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;