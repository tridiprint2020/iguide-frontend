import {
  lazy,
  Suspense,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";

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
import NotFound from "./pages/NotFound";
import PilotQrLanding from "./pages/PilotQrLanding";
import {
  MainContainer,
} from "./pages/MainContainer";

const ARPage = lazy(
  () => import("./pages/ARPage")
);

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
   * navegar por la app, incluso si la última subpantalla del
   * Journey fue la cámara o la MemoryCard.
   *
   * El estado de la misión es la fuente de verdad. La pantalla
   * interna no debe apagar el indicador global cuando el usuario
   * vuelve con el botón Atrás del navegador.
   */
  const hasActiveJourney =
    journey.experience !== null &&
    (
      journey.state === "WALKING" ||
      journey.state === "CAMERA_OPEN" ||
      journey.state === "POINT_SAVED"
    );

  const isJourneyRoute =
    location.pathname === "/journey" ||
    location.pathname.startsWith("/journey/");

  const showGlobalBubble =
    hasActiveJourney &&
    !isJourneyRoute;

  return showGlobalBubble
    ? <ActiveJourneyBubble />
    : null;
}

function App() {
  /*
   * La suscripción global vuelve a renderizar todas las rutas
   * cuando el usuario cambia entre español e inglés.
   */
  useTranslation();

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

        <Route
          path="/ar"
          element={
            <Suspense
              fallback={
                <div
                  role="status"
                  style={{
                    minHeight: "100dvh",
                    display: "grid",
                    placeItems: "center",
                    background: "#05060B",
                    color: "#FFFFFF",
                  }}
                >
                  I.GUIDE AR…
                </div>
              }
            >
              <ARPage />
            </Suspense>
          }
        />

        <Route
          path="/q/:sourceCode"
          element={<PilotQrLanding />}
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

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </>
  );
}

export default App;
