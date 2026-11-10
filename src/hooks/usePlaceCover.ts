import { useEffect, useState, useSyncExternalStore } from "react";
import { incorporatedPlaceCover, type PlaceWithImage } from "../engine/placeCoverContract";
import { getPlaceCoverSnapshot, replacePlaceCovers, subscribeToPlaceCovers } from "../engine/placeCoverStore";
import { getPlacePhotoService } from "../services/placePhotoService";

const COVER_REFRESH_MS = 15 * 60 * 1000;

export function usePlaceCovers() {
  return useSyncExternalStore(subscribeToPlaceCovers, getPlaceCoverSnapshot, getPlaceCoverSnapshot);
}
export function usePlaceCover(place: PlaceWithImage) {
  return usePlaceCovers().get(place.experienceId)?.url ?? incorporatedPlaceCover(place);
}
export function usePlaceCoverImage(place: PlaceWithImage, lastFallback?: string) {
  const remote = usePlaceCovers().get(place.experienceId);
  const [failed, setFailed] = useState<string[]>([]);
  const src = [remote?.url, incorporatedPlaceCover(place), lastFallback]
    .find(value => value && !failed.includes(value));
  return {
    src,
    alt: src === remote?.url ? remote?.alt_text : undefined,
    onError: () => { if (src) setFailed(previous => previous.includes(src) ? previous : [...previous, src]); },
  };
}

export function useLoadPublicPlaceCovers() {
  useEffect(() => {
    let service;
    try { service = getPlacePhotoService(); } catch { return; }
    if (!service) return;
    const client = service;
    let active = true;
    let loading = false;
    let lastAttemptAt = -Infinity;
    async function refresh() {
      const now = Date.now();
      if (loading || document.visibilityState === "hidden" || now - lastAttemptAt < COVER_REFRESH_MS) return;
      lastAttemptAt = now;
      loading = true;
      const previous = getPlaceCoverSnapshot();
      try {
        const rows = await client.listCovers();
        if (active && getPlaceCoverSnapshot() === previous) replacePlaceCovers(client.config.url, rows);
      } catch { /* Photos are optional: the incorporated catalogue remains usable. */ }
      finally { loading = false; }
    }
    void refresh();
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, COVER_REFRESH_MS);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);
}
