import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Experience } from "../types/experience/experience";
import type { ActiveJourney } from "../types/journeyFlow";
import type {
  CompletionResult,
  TimelineItem,
} from "../types/tracking/tracking";

import { catalog } from "../data/catalog";
import { completeExpedition } from "../data/user";
import {
  addAbortPoint,
  addMemoryToTrack,
  canCompleteJourney,
  certifyArrivalAtPosition,
  completeTrack,
  createStartPoint,
  deleteTrack,
  loadTrack,
} from "../engine/trackingEngine";

import { locationTracker } from "../engine/locationTracker";
import { sensoryFeedbackEngine } from "../engine/sensoryFeedbackEngine";
import { getGeolocationOutcomeReason } from "../engine/pilotTelemetryEngine";
import { recordPilotEvent } from "../repository/pilotTelemetryRepository";
import { tx } from "../i18n";

interface JourneyContextType {
  journey: ActiveJourney;
  startWalking: (experience: Experience) => boolean;
  pauseJourney: () => void;
  abandonJourney: () => void;
  resetToHome: () => void;
  openCamera: () => void;
  savePoint: (item: TimelineItem) => void;
  resumeWalking: () => void;
  confirmArrival: () => Promise<CompletionResult>;
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

  /*
   * Si la aplicación abrió con una misión que ya existía,
   * el primer GPS pertenece a una reanudación. En una misión
   * recién iniciada permanece en false.
   */
  const resumedFromStorageRef =
    useRef(
      journey.state === "WALKING" &&
      journey.startedAt !== null
    );

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
  function activateLiveTracking(
    experience: Experience,
    startsNewSegment = false
  ) {
    locationTracker.stop();

    locationTracker.start(
      experience.experienceId,

      () => {
        syncJourneyTimeline(experience.experienceId);
      },

      completeJourney,
      {
        startsNewSegment,
      }
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
    confirmedExperience,
    resumedFromStorageRef.current
  );

  resumedFromStorageRef.current =
    false;

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
        confirmedExperience,
        true
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

  const targetExperienceId =
    experience.experienceId;

  const startAttemptId =
    crypto.randomUUID();

  recordPilotEvent(
    "mission_start_requested",
    {
      experienceId:
        targetExperienceId,
      dedupeKey: startAttemptId,
    }
  );

  if (!navigator.geolocation) {
    recordPilotEvent(
      "mission_start_failed",
      {
        experienceId:
          targetExperienceId,
        outcomeReason:
          "unsupported",
        dedupeKey: startAttemptId,
      }
    );

    alert(
      tx("Tu dispositivo no soporta geolocalización.")
    );
    return false;
  }

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
      recordPilotEvent(
        "mission_start_failed",
        {
          experienceId:
            targetExperienceId,
          outcomeReason:
            "another_mission_active",
          dedupeKey: startAttemptId,
        }
      );

      alert(
        tx("Ya tienes una misión activa. Continúala o abandónala antes de iniciar otra.")
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

    recordPilotEvent(
      "mission_started",
      {
        experienceId:
          targetExperienceId,
        outcomeReason: "resumed",
        dedupeKey:
          existingTrack.sessionId,
      }
    );

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

      recordPilotEvent(
        "mission_started",
        {
          experienceId:
            targetExperienceId,
          dedupeKey:
            initialTrack.sessionId,
        }
      );

      sensoryFeedbackEngine.missionStart();

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

      recordPilotEvent(
        "mission_start_failed",
        {
          experienceId:
            targetExperienceId,
          outcomeReason:
            getGeolocationOutcomeReason(
              error.code
            ),
          dedupeKey: startAttemptId,
        }
      );

      localStorage.removeItem(
        ACTIVE_JOURNEY_KEY
      );

      setJourney(
        defaultJourney
      );

      alert(
        tx("No se pudo iniciar la misión. Activa el GPS y concede permiso de ubicación.")
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
    sensoryFeedbackEngine.prepare();

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
    const activeExperience =
      journey.experience;

    if (!activeExperience) {
      return;
    }

    const experienceId =
      activeExperience.experienceId;

    addMemoryToTrack(experienceId, {
      lat: item.lat,
      lng: item.lng,
      note: item.note,
      photo: item.photo,
    });

    const updatedTrack =
      loadTrack(experienceId);

    setJourney((previous) => {
      if (
        previous.experience
          ?.experienceId !==
        experienceId
      ) {
        return previous;
      }

      return {
        ...previous,
        timeline:
          updatedTrack?.timeline ??
          previous.timeline,
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

  const activeExperience =
    journey.experience;

  if (!activeExperience) {
    localStorage.removeItem(
      ACTIVE_JOURNEY_KEY
    );

    setJourney(defaultJourney);
    return;
  }

  const experienceId =
    activeExperience.experienceId;

  const persistedTrack =
    loadTrack(experienceId);

  if (!persistedTrack) {
    localStorage.removeItem(
      ACTIVE_JOURNEY_KEY
    );

    setJourney(defaultJourney);
    return;
  }

  const timeline =
    persistedTrack.timeline;

  const alreadyAborted =
    timeline.some(
      (item) =>
        item.type === "abort"
    );

  const alreadyCompleted =
    Boolean(
      persistedTrack.completedAt
    ) ||
    timeline.some(
      (item) =>
        item.type === "finish"
    );

  let preservedTrack =
    persistedTrack;

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
      preservedTrack =
        addAbortPoint(
          experienceId,
          lastGeoPoint.lat,
          lastGeoPoint.lng
        ) ?? persistedTrack;
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

  recordPilotEvent(
    "mission_abandoned",
    {
      experienceId,
      dedupeKey:
        preservedTrack.sessionId,
    }
  );

  localStorage.removeItem(
    ACTIVE_JOURNEY_KEY
  );

  setJourney({
    state: "ABORTED",
    screen: "aborted",
    experience:
      activeExperience,
    startedAt:
      preservedTrack.startedAt,
    timeline:
      preservedTrack.timeline,
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

function confirmArrival(): Promise<CompletionResult> {
  const activeExperience =
    journey.experience;

  if (!activeExperience) {
    return Promise.resolve({
      success: false,
      reason: "timeline",
      message:
        tx("No hay una misión activa para confirmar."),
    });
  }

  if (!navigator.geolocation) {
    return Promise.resolve({
      success: false,
      reason: "gps",
      message:
        tx("Este dispositivo no permite obtener ubicación GPS."),
    });
  }

  return new Promise(
    (resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result =
            certifyArrivalAtPosition(
              activeExperience
                .experienceId,
              position.coords
                .latitude,
              position.coords
                .longitude
            );

          if (result.success) {
            syncJourneyTimeline(
              activeExperience
                .experienceId
            );

            sensoryFeedbackEngine.arrival();
            completeJourney();
          }

          resolve(result);
        },
        () => {
          resolve({
            success: false,
            reason: "gps",
            message:
              tx("No pude leer tu ubicación. Activa el GPS e inténtalo nuevamente."),
          });
        },
        {
          enableHighAccuracy:
            true,
          maximumAge: 3000,
          timeout: 15000,
        }
      );
    }
  );
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

    recordPilotEvent(
      "mission_certified",
      {
        experienceId,
        dedupeKey:
          completedTrack.sessionId,
      }
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
    confirmArrival,
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
