import {
  Routes,
  Route,
} from "react-router-dom";

import Expedition from "./pages/Expedition";
import Explorer from "./pages/Explorer";
import ItineraryResult from "./pages/ItineraryResult";
import ItineraryQuiz from "./pages/ItineraryQuiz";
import Hospes from "./pages/Hospes";
import MapPage from "./pages/MapPage";
import Favorites from "./pages/Favorites";

import {
  MainContainer,
} from "./pages/MainContainer";

import ActiveJourneyBubble from "./components/journey/ActiveJourneyBubble";

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <MainContainer />
          }
        />

        <Route
          path="/expedition/:slug"
          element={
            <Expedition />
          }
        />

        <Route
          path="/explorer"
          element={
            <Explorer />
          }
        />

        <Route
          path="/favoritos"
          element={
            <Favorites />
          }
        />

        <Route
          path="/itinerario"
          element={
            <ItineraryQuiz />
          }
        />

        <Route
          path="/itinerario/resultado"
          element={
            <ItineraryResult />
          }
        />

        <Route
          path="/hospes"
          element={
            <Hospes />
          }
        />

        <Route
          path="/mapa"
          element={
            <MapPage />
          }
        />
      </Routes>

      <ActiveJourneyBubble />
    </>
  );
}

export default App;