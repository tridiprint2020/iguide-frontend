import { useState } from "react";
import { useJourney } from "../../context/JourneyContext";
import MemoryCard from "../MemoryCard";
import ShareDrawer from "../sharing/ShareDrawer";
import { loadTrack } from "../../engine/trackingEngine";
import { MemoryCardEngine } from "../../engine/memoryCardEngine";
import HospesBanner from "../hospes/HospesBanner";
import { getHospesMessage } from "../../engine/hospesContextEngine";

export function PointSavedView() {
  const { journey, resumeWalking } = useJourney();

  const [shareOpen, setShareOpen] = useState(false);

  const track = journey.experience
    ? loadTrack(journey.experience.experienceId)
    : null;

  const memories =
    track?.timeline.filter((item) => item.type === "memory") ?? [];

  const lastMemory = memories[memories.length - 1];

  const [note, setNote] = useState(lastMemory?.note ?? "");

  const cardData =
    journey.experience && track
      ? MemoryCardEngine.build(journey.experience, track, {
          photo: lastMemory?.photo,
          note,
          lat: lastMemory?.lat,
          lng: lastMemory?.lng,
        })
      : null;

     const hospesBannerMessage =
  getHospesMessage({
    screen: "memory",
    experience: journey.experience,
    timeline: track?.timeline ?? journey.timeline,
  });

  async function handleShareMemory() {
    if (!cardData) return;

    const shareText = [
      `¡Mi momento en ${cardData.city}! 📍`,
      "",
      `"${cardData.note || "Un recuerdo guardado con I.GUIDE."}"`,
      "",
      `${cardData.stats.totalDistanceKm.toFixed(2)} km recorridos`,
      `${cardData.stats.totalMemories} recuerdo(s) registrado(s)`,
      "",
      "#IGuide #LiveLikeLocal #FeelTheCity",
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: cardData.title,
          text: shareText,
        });

        setShareOpen(false);
        return;
      }

      await navigator.clipboard.writeText(shareText);

      alert("Texto del recuerdo copiado al portapapeles.");
      setShareOpen(false);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error("No se pudo compartir el recuerdo:", error);
      alert("No se pudo abrir el menú para compartir.");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6 antialiased">
      {/* CONTENIDO PRINCIPAL */}
      <div className="space-y-4 flex flex-col items-center">
        <div className="w-full flex items-center space-x-2 text-emerald-500 font-semibold text-sm self-start">
          <span>✓</span>
          <span>Hito geolocalizado</span>
        </div>

        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight self-start">
  ¡Recuerdo asegurado!
</h2>
<div className="w-full">
  <HospesBanner
    message={hospesBannerMessage}
  />
</div>

        <p className="text-sm text-zinc-500 font-medium self-start">
          📍 Recuerdo registrado durante la expedición
        </p>

        {/* TARJETA DEL RECUERDO */}
        <div className="mt-4 my-2 balance-card">
          {cardData ? (
            <MemoryCard
              data={cardData}
              onShare={() => setShareOpen(true)}
            />
          ) : (
            <div className="w-full rounded-xl border border-zinc-200 p-5 text-center text-sm text-zinc-500">
              Preparando la tarjeta del recuerdo...
            </div>
          )}
        </div>

        {/* NOTA EMOCIONAL */}
        <div className="w-full space-y-1.5 pt-2">
          <label
            htmlFor="memory-note"
            className="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
          >
            Añadir nota mental
          </label>

          <textarea
            id="memory-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="¿Qué te hace sentir este rincón de la ciudad?"
            className="w-full min-h-[100px] border border-zinc-200 rounded-xl p-4 text-zinc-800 text-sm focus:outline-none focus:border-[#FF007A] transition-colors resize-none shadow-inner"
          />
        </div>
      </div>

      {/* ACCIONES */}
      <div className="w-full space-y-2 mt-6">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          disabled={!cardData}
          className="w-full bg-[#FF007A] hover:bg-[#E0006C] disabled:opacity-40 text-white rounded-xl py-4 font-semibold active:scale-[0.99] transition shadow-md"
        >
          Compartir recuerdo ↗
        </button>

        <button
          type="button"
          onClick={resumeWalking}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-4 font-semibold active:scale-[0.99] transition shadow-md"
        >
          Continuar paseo →
        </button>
      </div>

      {/* MENÚ DE COMPARTICIÓN */}
      <ShareDrawer
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onInstagram={handleShareMemory}
        onFacebook={handleShareMemory}
        onThreads={handleShareMemory}
        onTwitter={handleShareMemory}
        onDownload={handleShareMemory}
        onCopyLink={handleShareMemory}
      />
    </div>
  );
}