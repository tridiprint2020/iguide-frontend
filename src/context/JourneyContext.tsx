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
  completeTrack,
  createStartPoint,
  deleteTrack,
  loadTrack,
} from "../engine/trackingEngine";

import { locationTracker } from "../engine/locationTracker";

interface JourneyContextType {
  journey: ActiveJourney;
  startWalking: (experience: Experience) => boolean;
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
  const activeExperience =
    journey.experience;

  /*
   * Todavía estamos mostrando la
   * activación optimista.
   *
   * startedAt === null significa:
   * aún esperamos el primer GPS.
   *
   * NO arrancamos locationTracker todavía.
   */
  if (
    !activeExperience ||
    journey.state !==
      "WALKING" ||
    journey.startedAt ===
      null
  ) {
    return;
  }

  const confirmedExperience:
    Experience =
      activeExperience;

  /*
   * En este punto:
   *
   * ✓ existe experiencia
   * ✓ existe start GPS
   * ✓ existe track
   *
   * Ahora sí watchPosition puede empezar.
   */
  activateLiveTracking(
    confirmedExperience
  );

  const handleVisibilityChange =
    () => {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      const activeExperienceId =
        localStorage.getItem(
          ACTIVE_JOURNEY_KEY
        );

      if (
        activeExperienceId !==
        confirmedExperience
          .experienceId
      ) {
        return;
      }

      syncJourneyTimeline(
        confirmedExperience
          .experienceId
      );

      activateLiveTracking(
        confirmedExperience
      );
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
}, [
  journey.experience
    ?.experienceId,
  journey.startedAt,
  journey.state,
]);
  /**
   * Crea una expedición nueva desde una posición GPS real.
   */
  function startWalking(
  experience: Experience
) {
  /*
   * El sonido se desbloquea dentro
   * del gesto real del usuario.
   */
  locationTracker.prepareFeedback();

  if (!navigator.geolocation) {
    alert(
      "Tu dispositivo no soporta geolocalización."
    );
    return false;
  }

  const targetExperienceId =
    experience.experienceId;

  let activeExperienceId =
    localStorage.getItem(
      ACTIVE_JOURNEY_KEY
    );

  /*
   * =====================================================
   * 1. EVITAR DOS MISIONES SIMULTÁNEAS
   * =====================================================
   */
  if (
    activeExperienceId &&
    activeExperienceId !==
      targetExperienceId
  ) {
    const activeTrack =
      loadTrack(
        activeExperienceId
      );

    if (
      activeTrack &&
      !activeTrack.completedAt
    ) {
      alert(
        "Ya tienes una misión activa. Continúala o abandónala antes de iniciar otra."
      );
      return false;
    }

    /*
     * Puntero viejo o misión ya terminada.
     */
    localStorage.removeItem(
      ACTIVE_JOURNEY_KEY
    );

    activeExperienceId =
      null;
  }

  /*
   * =====================================================
   * 2. RECUPERAR ESTA MISMA MISIÓN
   * =====================================================
   */
  const existingTrack =
    loadTrack(
      targetExperienceId
    );

  if (
    existingTrack &&
    !existingTrack.completedAt
  ) {
    localStorage.setItem(
      ACTIVE_JOURNEY_KEY,
      targetExperienceId
    );

    setJourney({
      state: "WALKING",
      screen: "walking",
      experience,
      startedAt:
        existingTrack.startedAt,
      timeline:
        existingTrack.timeline,
    });

    return true;
  }

  /*
   * =====================================================
   * 3. ACTIVACIÓN VISUAL INMEDIATA
   * =====================================================
   *
   * ESTE ES EL CAMBIO IMPORTANTE.
   *
   * React ya sabe que existe una misión
   * ANTES de esperar al GPS.
   *
   * Por tanto:
   * - aparece burbuja;
   * - Hospes puede reaccionar;
   * - botón cambia a misión activa;
   * - popup puede aparecer.
   */
  locationTracker.stop();

  setJourney({
    state: "WALKING",
    screen: "walking",
    experience,
    startedAt: null,
    timeline: [],
  });

  /*
   * =====================================================
   * 4. GPS EN SEGUNDO PLANO
   * =====================================================
   */
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const {
        latitude,
        longitude,
      } = position.coords;

      /*
       * Aquí recién existe el track
       * certificado con posición real.
       */
      const initialTrack =
        createStartPoint(
          targetExperienceId,
          latitude,
          longitude
        );

      /*
       * Ahora sí hacemos persistente
       * la misión activa.
       */
      localStorage.setItem(
        ACTIVE_JOURNEY_KEY,
        targetExperienceId
      );

      /*
       * Conservamos WALKING pero
       * incorporamos el Timeline real.
       */
      setJourney(
        (previous) => {
          /*
           * Protección básica:
           * si entretanto cambió la misión,
           * no sobrescribimos otra experiencia.
           */
          if (
            previous.experience
              ?.experienceId !==
            targetExperienceId
          ) {
            return previous;
          }

          return {
            ...previous,

            state:
              "WALKING",

            screen:
              "walking",

            startedAt:
              initialTrack.startedAt,

            timeline:
              initialTrack.timeline,
          };
        }
      );
    },

    (error) => {
      console.error(
        "No se pudo obtener la ubicación inicial:",
        error
      );

      localStorage.removeItem(
        ACTIVE_JOURNEY_KEY
      );

      setJourney(
        defaultJourney
      );

      alert(
        "No se pudo iniciar la misión. Activa el GPS y concede permiso de ubicación."
      );
    },

    {
      enableHighAccuracy:
        true,

      maximumAge:
        5000,

      timeout:
        15000,
    }
  );

  return true;
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
  /*
   * Ir a Home NO cancela una misión.
   * Abandonar es la única acción que debe destruir el estado activo.
   */
  const activeExperienceId =
    localStorage.getItem(
      ACTIVE_JOURNEY_KEY
    );

  if (activeExperienceId) {
    const experience = catalog.find(
      (item) =>
        item.experienceId ===
        activeExperienceId
    );

    const track = loadTrack(
      activeExperienceId
    );

    if (
      experience &&
      track &&
      !track.completedAt
    ) {
      setJourney({
        state: "WALKING",
        screen: "walking",
        experience,
        startedAt:
          track.startedAt,
        timeline:
          track.timeline,
      });

      return;
    }
  }

  locationTracker.stop();
  setJourney(
    defaultJourney
  );
}

function resumeWalking() {
  locationTracker.prepareFeedback();

  setJourney((prev) => ({
    ...prev,
    state: "WALKING",
    screen: "walking",
  }));
}

  function completeJourney() {
  locationTracker.stop();

  setJourney((previous) => {
    const experience =
      previous.experience;

    if (!experience) {
      localStorage.removeItem(
        ACTIVE_JOURNEY_KEY
      );

      return defaultJourney;
    }

    if (
      previous.state ===
      "COMPLETED"
    ) {
      return previous;
    }

    const experienceId =
      experience.experienceId;

    const validation =
      canCompleteJourney(
        experienceId
      );

    if (!validation.success) {
      console.warn(
        "Llegada todavía no certificada:",
        validation.message
      );

      return {
        ...previous,
        state: "WALKING",
        screen: "walking",
      };
    }

    /*
     * La certificación y el premio ocurren
     * juntos, en una sola transición.
     */
    const completedTrack =
      completeTrack(
        experienceId
      );

    if (!completedTrack) {
      console.error(
        "No fue posible completar el track:",
        experienceId
      );

      return {
        ...previous,
        state: "WALKING",
        screen: "walking",
      };
    }

    completeExpedition(
      experienceId,
      150
    );

    /*
     * Esto apaga inmediatamente la misión
     * activa y evita que reaparezca tras
     * recargar o volver desde otra página.
     */
    localStorage.removeItem(
      ACTIVE_JOURNEY_KEY
    );

    return {
      ...previous,
      state: "COMPLETED",
      screen: "completed",
      startedAt:
        completedTrack.startedAt,
      timeline:
        completedTrack.timeline,
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
