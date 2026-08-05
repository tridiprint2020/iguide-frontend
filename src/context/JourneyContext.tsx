import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Experience } from "../types/experience/experience";
import type { ActiveJourney } from "../types/journeyFlow";
import type { TimelineItem } from "../types/tracking/tracking";

import { catalog } from "../data/catalog";
import { completeExpedition } from "../data/user";
import {
  addAbortPoint,
  addMemoryToTrack,
  canCompleteJourney,
  createStartPoint,
  deleteTrack,
  loadTrack,
} from "../engine/trackingEngine";

import { locationTracker } from "../engine/locationTracker";

interface JourneyContextType {
  journey: ActiveJourney;
  startWalking: (experience: Experience) => void;
  pauseJourney: () => void;
  abandonJourney: () => void;
  resetToHome: () => void;
  openCamera: () => void;
  savePoint: (item: TimelineItem) => void;
  resumeWalking: () => void;
  completeJourney: () => void;
}

const defaultJourney: ActiveJourney = {
  state: "IDLE",
  screen: "idle",
  experience: null,
  startedAt: null,
  timeline: [],
};

const ACTIVE_JOURNEY_KEY = "iguide_active_journey";

function restoreActiveJourney(): ActiveJourney {
  const experienceId = localStorage.getItem(ACTIVE_JOURNEY_KEY);

  if (!experienceId) {
    return defaultJourney;
  }

  const experience = catalog.find(
    (item) => item.experienceId === experienceId
  );

  const track = loadTrack(experienceId);

  if (!experience || !track) {
    localStorage.removeItem(ACTIVE_JOURNEY_KEY);
    return defaultJourney;
  }

  return {
    state: track.completedAt ? "COMPLETED" : "WALKING",
    screen: track.completedAt ? "completed" : "walking",
    experience,
    startedAt: track.startedAt,
    timeline: track.timeline,
  };
}

const JourneyContext =
  createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [journey, setJourney] =
    useState<ActiveJourney>(() => restoreActiveJourney());

  /**
   * Sincroniza React con el Timeline persistido.
   */
  function syncJourneyTimeline(experienceId: string) {
    const updatedTrack = loadTrack(experienceId);

    if (!updatedTrack) {
      return;
    }

    setJourney((prev) => ({
      ...prev,
      startedAt: updatedTrack.startedAt,
      timeline: updatedTrack.timeline,
    }));
  }

  /**
   * Enciende el seguimiento continuo para una experiencia ya creada.
   */
  function activateLiveTracking(experience: Experience) {
    locationTracker.stop();

    locationTracker.start(
      experience.experienceId,

      () => {
        syncJourneyTimeline(experience.experienceId);
      },

      completeJourney
    );
  }

  /**
   * Reanuda el GPS después de:
   * - recargar la página;
   * - regresar desde la cámara;
   * - volver desde WhatsApp;
   * - restaurar la pestaña.
   */
  useEffect(() => {
  const activeExperience = journey.experience;

  if (
    !activeExperience ||
    journey.state === "IDLE" ||
    journey.state === "COMPLETED"
  ) {
    return;
  }

  const confirmedExperience: Experience = activeExperience;

  // El Contexto enciende el GPS una sola vez por experiencia.
  activateLiveTracking(confirmedExperience);

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    const activeExperienceId = localStorage.getItem(
      ACTIVE_JOURNEY_KEY
    );

    if (
      activeExperienceId !== confirmedExperience.experienceId
    ) {
      return;
    }

    // Recupera los puntos escritos mientras la pestaña estuvo fuera.
    syncJourneyTimeline(
      confirmedExperience.experienceId
    );

    // Reactiva el GPS al regresar desde cámara, WhatsApp u otra app.
    activateLiveTracking(confirmedExperience);
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  return () => {
    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    locationTracker.stop();
  };
}, [journey.experience?.experienceId]);
  /**
   * Crea una expedición nueva desde una posición GPS real.
   */
  function startWalking(experience: Experience) {
  if (!navigator.geolocation) {
    alert("Tu dispositivo no soporta geolocalización.");
    return;
  }

  const activeExperienceId = localStorage.getItem(
    ACTIVE_JOURNEY_KEY
  );

  /*
   * Si ya existe esta misma expedición activa,
   * no la borra ni crea otra: simplemente la recupera.
   */
  if (activeExperienceId === experience.experienceId) {
    const existingTrack = loadTrack(
      experience.experienceId
    );

    if (existingTrack && !existingTrack.completedAt) {
      setJourney({
        state: "WALKING",
        screen: "walking",
        experience,
        startedAt: existingTrack.startedAt,
        timeline: existingTrack.timeline,
      });

      return;
    }
  }

  /*
   * Impide iniciar una segunda experiencia mientras otra
   * continúa abierta.
   */
  if (
    activeExperienceId &&
    activeExperienceId !== experience.experienceId
  ) {
    alert(
      "Ya tienes una expedición activa. Continúala o abandónala antes de iniciar otra."
    );
    return;
  }

  locationTracker.stop();

const existingTrack = loadTrack(experience.experienceId);

if (existingTrack && !existingTrack.completedAt) {
  localStorage.setItem(
    ACTIVE_JOURNEY_KEY,
    experience.experienceId
  );

  setJourney({
    state: "WALKING",
    screen: "walking",
    experience,
    startedAt: existingTrack.startedAt,
    timeline: existingTrack.timeline,
  });

  return;
}

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      const initialTrack = createStartPoint(
        experience.experienceId,
        latitude,
        longitude
      );

      localStorage.setItem(
        ACTIVE_JOURNEY_KEY,
        experience.experienceId
      );

      setJourney({
        state: "WALKING",
        screen: "walking",
        experience,
        startedAt: initialTrack.startedAt,
        timeline: initialTrack.timeline,
      });

      // No llamamos activateLiveTracking aquí.
      // El useEffect lo iniciará una sola vez.
    },

    (error) => {
      console.error(
        "No se pudo obtener la ubicación inicial:",
        error
      );

      alert(
        "No se pudo iniciar la expedición. Activa el GPS y concede permiso de ubicación."
      );
    },

    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    }
  );
}

  function openCamera() {
    setJourney((prev) => ({
      ...prev,
      state: "CAMERA_OPEN",
      screen: "camera",
    }));
  }

  /**
   * Guarda una foto o nota como recuerdo persistente.
   */
  function savePoint(item: TimelineItem) {
    setJourney((prev) => {
      if (!prev.experience) {
        return prev;
      }

      addMemoryToTrack(prev.experience.experienceId, {
        lat: item.lat,
        lng: item.lng,
        note: item.note,
        photo: item.photo,
      });

      const updatedTrack = loadTrack(
        prev.experience.experienceId
      );

      return {
        ...prev,
        timeline:
          updatedTrack?.timeline ?? prev.timeline,
        state: "POINT_SAVED",
        screen: "pointSaved",
      };
    });
  }

 function pauseJourney() {
  locationTracker.stop();

  setJourney((prev) => ({
    ...prev,
    state: "WALKING",
    screen: "walking",
  }));
}

function abandonJourney() {
  locationTracker.stop();

  setJourney((prev) => {
    const activeExperience =
      prev.experience;

    if (!activeExperience) {
      localStorage.removeItem(
        ACTIVE_JOURNEY_KEY
      );

      return defaultJourney;
    }

    const experienceId =
      activeExperience.experienceId;

    const persistedTrack =
      loadTrack(experienceId);

    const timeline =
      persistedTrack?.timeline ??
      prev.timeline;

    const alreadyAborted =
      timeline.some(
        (item) =>
          item.type === "abort"
      );

    const alreadyCompleted =
      Boolean(
        persistedTrack?.completedAt
      ) ||
      timeline.some(
        (item) =>
          item.type === "finish"
      );

    if (
      !alreadyAborted &&
      !alreadyCompleted
    ) {
      const lastGeoPoint =
        [...timeline]
          .reverse()
          .find(
            (item) =>
              item.type ===
                "start" ||
              item.type ===
                "walk" ||
              item.type ===
                "memory"
          );

      if (lastGeoPoint) {
        addAbortPoint(
          experienceId,
          lastGeoPoint.lat,
          lastGeoPoint.lng
        );
      }
    }

    /*
     * El historial permanece guardado bajo:
     * iguide_track_<id>_<sessionId>
     *
     * Solo eliminamos el puntero activo:
     * iguide_track_<id>
     */
    deleteTrack(experienceId);

    localStorage.removeItem(
      ACTIVE_JOURNEY_KEY
    );

    return defaultJourney;
  });
}

function resetToHome() {
  locationTracker.stop();
  setJourney(defaultJourney);
}

function resumeWalking() {
  setJourney((prev) => ({
    ...prev,
    state: "WALKING",
    screen: "walking",
  }));
}

  function completeJourney() {
  locationTracker.stop();

  setJourney((prev) => {
    if (!prev.experience) {
      return prev;
    }

    if (prev.state === "COMPLETED") {
      return prev;
    }

    const experienceId =
      prev.experience.experienceId;

    const validation =
      canCompleteJourney(experienceId);

    if (!validation.success) {
      console.warn(
        "Expedición no certificada:",
        validation.message
      );

      return {
        ...prev,
        state: "WALKING",
        screen: "walking",
      };
    }

    const finalTrack = loadTrack(experienceId);

    if (!finalTrack?.completedAt) {
      console.warn(
        "La validación fue correcta, pero el track todavía no está marcado como completado."
      );

      return {
        ...prev,
        state: "WALKING",
        screen: "walking",
      };
    }

    completeExpedition(experienceId, 150);

    localStorage.removeItem(
      ACTIVE_JOURNEY_KEY
    );

    return {
      ...prev,
      state: "COMPLETED",
      screen: "completed",
      timeline: finalTrack.timeline,
    };
  });
}

  return (
   <JourneyContext.Provider
  value={{
    journey,
    startWalking,
    pauseJourney,
    abandonJourney,
    resetToHome,
    openCamera,
    savePoint,
    resumeWalking,
    completeJourney,
  }}
>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);

  if (!context) {
    throw new Error(
      "useJourney debe utilizarse dentro de JourneyProvider"
    );
  }

  return context;
}