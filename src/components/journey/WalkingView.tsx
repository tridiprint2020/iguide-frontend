import { useNavigate } from "react-router-dom";
import { useJourney } from "../../context/JourneyContext";
import { getJourneyStats } from "../../engine/trackingEngine";

import JourneyCompletedView from "./JourneyCompletedView";
import { CameraView } from "./CameraView";
import { PointSavedView } from "./PointSavedView";
import HospesBanner from "../hospes/HospesBanner";
import { getHospesMessage } from "../../engine/hospesContextEngine";

export function WalkingView() {
  const navigate = useNavigate();

  const {
    journey,
    openCamera,
    abandonJourney,
  } = useJourney();

  const stats =
    journey.startedAt !== null
      ? getJourneyStats(
          journey.timeline,
          journey.startedAt
        )
      : null;

  const durationMinutes = Math.floor(
    (stats?.durationSeconds ?? 0) / 60
  );

  const hospesBannerMessage =
  getHospesMessage({
    screen: "walking",
    experience: journey.experience,
    timeline: journey.timeline,
  });

  function handleGoHome() {
    const confirmed = window.confirm(
      "¿Deseas salir al inicio? Tu recorrido guardado se conservará."
    );

    if (!confirmed) {
      return;
    }

    abandonJourney();
    navigate("/");
  }

  function handleAbandonAndExplore() {
    const confirmed = window.confirm(
      "¿Deseas abandonar esta sesión? La ruta registrada hasta ahora permanecerá guardada."
    );

    if (!confirmed) {
      return;
    }

    abandonJourney();
    navigate("/explorer");
  }

  function WalkingUI() {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-zinc-200 p-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleGoHome}
            className="text-zinc-600 hover:text-black transition-colors"
          >
            ← Inicio
          </button>

          <span className="text-[#FF007A] font-semibold flex items-center gap-1.5">
            <span aria-hidden="true">●</span>
            Expedición activa
          </span>
        </header>

        <main className="flex-1 flex flex-col justify-center items-center gap-10 px-6">
          <div className="text-center">
            <p className="uppercase text-xs tracking-[0.25em] text-zinc-400">
              Explorando
            </p>

            <h1 className="text-4xl font-bold mt-2 text-zinc-900">
  {journey.experience?.title ?? "Destino"}
</h1>

            <p className="mt-3 text-sm text-zinc-500">
              {journey.timeline.length} eventos registrados
            </p>
          </div>
<div className="w-full max-w-xl">
  <HospesBanner
    message={hospesBannerMessage}
  />
</div>
          <div className="grid grid-cols-2 gap-10">
            <div className="text-center">
              <p className="text-zinc-400">
                Tiempo
              </p>

              <h2 className="font-mono text-3xl mt-1 text-zinc-800">
                {durationMinutes} min
              </h2>
            </div>

            <div className="text-center">
              <p className="text-zinc-400">
                Distancia
              </p>

              <h2 className="font-mono text-3xl mt-1 text-zinc-800">
                {(stats?.totalDistanceKm ?? 0).toFixed(2)} km
              </h2>
            </div>
          </div>
        </main>

        <footer className="p-6 space-y-3">
          <button
            type="button"
            onClick={openCamera}
            className="w-full bg-[#FF007A] text-white rounded-xl py-4 font-semibold active:scale-95 transition hover:bg-[#E0006C]"
          >
            📸 Guardar recuerdo
          </button>

          <button
            type="button"
            onClick={handleAbandonAndExplore}
            className="w-full border border-zinc-300 bg-white text-zinc-700 rounded-xl py-3 font-semibold active:scale-[0.99] transition"
          >
            Abandonar y conservar ruta
          </button>
        </footer>
      </div>
    );
  }

  switch (journey.screen) {
    case "walking":
      return <WalkingUI />;

    case "camera":
      return <CameraView />;

    case "pointSaved":
      return <PointSavedView />;

    case "completed":
      return <JourneyCompletedView />;

    case "idle":
    default:
      return null;
  }
}