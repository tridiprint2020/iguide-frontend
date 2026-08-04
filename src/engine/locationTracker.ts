import {
  addPointToTrack,
  addFinishPoint,
  completeTrack,
  canCompleteJourney,
  loadTrack,
} from "./trackingEngine";

import { catalog } from "../data/catalog";

const MIN_DISTANCE_METERS = 8;
const MAX_ACCEPTABLE_ACCURACY_METERS = 30;
const MIN_TIME_BETWEEN_POINTS_MS = 4000;
const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 3000,
  timeout: 15000,
};

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function playArrivalFeedback(): void {
  // Vibración breve: compatible con Android.
  if ("vibrate" in navigator) {
    navigator.vibrate([120, 70, 180]);
  }

  // Timbre corto sintetizado, sin archivos externos.
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      659.25,
      audioContext.currentTime
    );

    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime + 0.14
    );

    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.22,
      audioContext.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.38
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);

    oscillator.addEventListener("ended", () => {
      void audioContext.close();
    });
  } catch (error) {
    console.warn("No se pudo reproducir el timbre I.GUIDE:", error);
  }
}
export type LocationCallback = (lat: number, lng: number) => void;

export class LocationTracker {
  private watchId: number | null = null;
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private lastAcceptedTimestamp = 0;
private arrivalNotifiedExperienceId: string | null = null;
  start(
  experienceId: string,
  onUpdate: LocationCallback,
  completeJourneyContext: () => void
): void {
  if (!navigator.geolocation) {
    console.error("Geolocalización no disponible en este navegador.");
    return;
  }

  // GARANTÍA DEL TRACKER:
  // Nunca pueden existir dos watchPosition simultáneos.
  if (this.watchId !== null) {
    this.stop();
  }

this.arrivalNotifiedExperienceId = null;
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Función interna para centralizar la validación automática en cada hito
        const processCheckpoint = (
  lat: number,
  lng: number,
  accuracyMeters: number
) => {
  const experience = catalog.find(
    (item) => item.experienceId === experienceId
  );

  if (!experience) {
    console.error(
      "No se encontró la experiencia activa:",
      experienceId
    );
    return;
  }

  const configuredRadius =
    experience.certificationRadiusMeters ?? 20;

  /*
   * Un teléfono normalmente puede reportar entre 10 y 40 metros
   * de precisión. Nunca usamos menos que el radio configurado,
   * pero tampoco ampliamos la certificación por encima de 50 m.
   */
  const effectiveRadius = Math.max(
    configuredRadius,
    Math.min(Math.max(accuracyMeters, 20), 50)
  );

  const distanceToDestination = getDistanceMeters(
    lat,
    lng,
    experience.latitude,
    experience.longitude
  );

  console.info("📍 Proximidad I.GUIDE", {
    destination: experience.title,
    distanceMeters: Math.round(distanceToDestination),
    configuredRadius,
    effectiveRadius,
    accuracyMeters: Math.round(accuracyMeters),
    currentPosition: { lat, lng },
    targetPosition: {
      lat: experience.latitude,
      lng: experience.longitude,
    },
  });

  if (distanceToDestination > effectiveRadius) {
    return;
  }

  const currentTrack = loadTrack(experienceId);

  if (!currentTrack || currentTrack.completedAt) {
    return;
  }

 const hasMemory = currentTrack.timeline.some(
  (item) => item.type === "memory"
);

if (!hasMemory) {
  const pendingMemoryKey =
    `${experienceId}:pending-memory`;

  if (
    this.arrivalNotifiedExperienceId !==
    pendingMemoryKey
  ) {
    this.arrivalNotifiedExperienceId =
      pendingMemoryKey;

    if ("vibrate" in navigator) {
      navigator.vibrate([120, 80, 120]);
    }

    alert(
      `📍 Llegaste a ${experience.title}.\n\nGuarda una foto o una nota para certificar la visita.`
    );
  }

  return;
}

const alreadyHasFinish =
  currentTrack.timeline.some(
    (item) => item.type === "finish"
  );

if (!alreadyHasFinish) {
  addFinishPoint(experienceId, lat, lng);
}

const validation =
  canCompleteJourney(experienceId);

if (!validation.success) {
  const validationKey =
    `${experienceId}:${validation.reason}:${validation.message}`;

  if (
    this.arrivalNotifiedExperienceId !==
    validationKey
  ) {
    this.arrivalNotifiedExperienceId =
      validationKey;

    if ("vibrate" in navigator) {
      navigator.vibrate([100, 70, 100]);
    }

    alert(
      `📍 Llegada reconocida en ${experience.title}.\n\n${validation.message}`
    );
  }

  return;
}

// Certificación oficial
completeTrack(experienceId);

// Sincroniza React con el finish y completedAt.
onUpdate(lat, lng);

// Feedback de llegada exitosa.
playArrivalFeedback();

if ("vibrate" in navigator) {
  navigator.vibrate([120, 70, 180, 70, 220]);
}

alert(
  `🎉 ¡Llegaste a ${experience.title}!\n\nExpedición certificada: +150 XP`
);

this.stop();
completeJourneyContext();
};
// La llegada se comprueba en TODAS las lecturas GPS.
// No depende del filtro de movimiento mínimo de la línea.
processCheckpoint(
  latitude,
  longitude,
  position.coords.accuracy
);
       const now = Date.now();
const accuracyMeters =
  position.coords.accuracy;

if (
  this.lastLat === null ||
  this.lastLng === null
) {
  this.lastLat = latitude;
  this.lastLng = longitude;
  this.lastAcceptedTimestamp = now;

  onUpdate(latitude, longitude);
  return;
}

const tooSoon =
  now - this.lastAcceptedTimestamp <
  MIN_TIME_BETWEEN_POINTS_MS;

const hasValidAccuracy =
  Number.isFinite(accuracyMeters) &&
  accuracyMeters > 0;

const tooImprecise =
  hasValidAccuracy &&
  accuracyMeters >
    MAX_ACCEPTABLE_ACCURACY_METERS;

if (tooSoon || tooImprecise) {
  return;
}

const moved = getDistanceMeters(
  this.lastLat,
  this.lastLng,
  latitude,
  longitude
);

if (moved < MIN_DISTANCE_METERS) {
  return;
}

addPointToTrack(experienceId, {
  lat: latitude,
  lng: longitude,
  timestamp: now,
  type: "walk",
});

this.lastLat = latitude;
this.lastLng = longitude;
this.lastAcceptedTimestamp = now;

onUpdate(latitude, longitude);
      },
      (error) => {
        console.error("Error de GPS:", error.message);
      },
      HIGH_ACCURACY_OPTIONS
    );
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log("🔒 GPS apagado con éxito. Sensor liberado.");
    }
    this.lastLat = null;
this.lastLng = null;
this.lastAcceptedTimestamp = 0;
this.arrivalNotifiedExperienceId = null;
  }
}

export const locationTracker = new LocationTracker();
