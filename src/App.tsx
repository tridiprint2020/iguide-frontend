import {
  useEffect,
  lazy,
  Suspense,
} from "react";
import { useTranslation } from "react-i18next";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

const Expedition = lazy(() => import("./pages/Expedition"));
const Explorer = lazy(() => import("./pages/Explorer"));
const ItineraryPage = lazy(() => import("./pages/ItineraryPage"));
const Hospes = lazy(() => import("./pages/Hospes"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
import {
  MainContainer,
} from "./pages/MainContainer";

const WalkingView = lazy(() => import("./components/journey/WalkingView").then(module => ({ default: module.WalkingView })));

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
  const { t } = useTranslation();

  return (
    <>
      <JourneyUiCoordinator />

      <Suspense fallback={<p role="status" style={{ padding: 24, color: "white" }}>{t("Cargando…")}</p>}>
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

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;
