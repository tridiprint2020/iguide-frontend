import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import type {
  HospesDecision,
} from "../types/hospesBrain";

import {
  Theme,
} from "../styles/theme";

import {
  useJourney,
} from "../context/JourneyContext";

import {
  catalog,
} from "../data/catalog";

const ACTIVE_JOURNEY_KEY =
  "iguide_active_journey";

const MAGENTA = "#FF00FF";
const CYAN = "#39E7FF";

type Props = {
  decision: HospesDecision;
};

function HospesActionCard({
  decision,
}: Props) {
  const navigate =
    useNavigate();

  const {
    journey,
    startWalking,
  } = useJourney();

  const [
    pendingExperienceId,
    setPendingExperienceId,
  ] = useState<string | null>(
    null
  );

  const [
    launchNotice,
    setLaunchNotice,
  ] = useState<string | null>(
    null
  );

  const navigateTimerRef =
    useRef<number | null>(
      null
    );

  const isExperienceAction =
    decision.action.type ===
    "open-experience";

  const recommendedExperience =
    isExperienceAction
      ? catalog.find(
          (experience) =>
            experience.slug ===
              decision.action.target ||
            experience.experienceId ===
              decision.action.target
        ) ?? null
      : null;

  const pendingExperience =
    pendingExperienceId
      ? catalog.find(
          (experience) =>
            experience.experienceId ===
            pendingExperienceId
        ) ?? null
      : null;

  const isThisMissionActive =
    journey.state === "WALKING" &&
    journey.experience
      ?.experienceId ===
      recommendedExperience
        ?.experienceId;

  /*
   * IMPORTANTE:
   * No navegamos a la ficha hasta que JourneyContext ya tenga
   * el punto de inicio GPS real (startedAt != null).
   *
   * Esto evita perder la misión si el Provider se remonta durante
   * la navegación antes de que trackingEngine haya creado el track.
   */
  useEffect(() => {
    if (
      !pendingExperienceId ||
      !pendingExperience
    ) {
      return;
    }

    const sameMission =
      journey.experience
        ?.experienceId ===
      pendingExperienceId;

    const gpsStartReady =
      journey.state ===
        "WALKING" &&
      journey.startedAt !==
        null;

    if (
      !sameMission ||
      !gpsStartReady
    ) {
      return;
    }

    setLaunchNotice(
      `Misión iniciada: ${pendingExperience.title}. Hospes ya está siguiendo tu recorrido.`
    );

    if (
      navigateTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        navigateTimerRef.current
      );
    }

    navigateTimerRef.current =
      window.setTimeout(() => {
        navigate(
          `/expedition/${pendingExperience.slug}`
        );
      }, 650);

    return () => {
      if (
        navigateTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          navigateTimerRef.current
        );

        navigateTimerRef.current =
          null;
      }
    };
  }, [
    journey.experience
      ?.experienceId,
    journey.state,
    journey.startedAt,
    pendingExperience,
    pendingExperienceId,
    navigate,
  ]);

  function handleAction(
    event: MouseEvent<HTMLButtonElement>
  ) {
    /*
     * Si esta tarjeta vive dentro de otro card/link clickeable,
     * impedimos que el click burbujee y navegue a la ficha antes
     * de ejecutar startWalking().
     */
    event.preventDefault();
    event.stopPropagation();

    switch (
      decision.action.type
    ) {
      case "open-experience": {
        const experience =
          catalog.find(
            (item) =>
              item.slug ===
                decision.action
                  .target ||
              item.experienceId ===
                decision.action
                  .target
          );

        if (!experience) {
          console.warn(
            "Hospes no encontró la experiencia:",
            decision.action.target
          );

          navigate(
            "/explorer"
          );

          return;
        }

        setLaunchNotice(
          `Activando misión: ${experience.title}…`
        );

        startWalking(
          experience
        );

        /*
         * startWalking escribe el puntero activo sincrónicamente.
         * Si no coincide, significa que otra misión bloqueó el inicio
         * o que el Contexto rechazó la activación.
         */
        const activeId =
          localStorage.getItem(
            ACTIVE_JOURNEY_KEY
          );

        if (
          activeId !==
          experience.experienceId
        ) {
          setLaunchNotice(
            null
          );
          return;
        }

        setPendingExperienceId(
          experience.experienceId
        );

        return;
      }

      case "open-category":
        navigate(
          `/categoria/${decision.action.target}`
        );
        return;

      case "open-itinerary":
        navigate(
          "/itinerario"
        );
        return;

      case "open-map":
        navigate(
          "/mapa"
        );
        return;
    }
  }

  function handleOpenJourney(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    navigate(
      "/journey"
    );
  }

  return (
    <>
      {launchNotice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position:
              "fixed",
            top:
              "max(18px, env(safe-area-inset-top))",
            left: "50%",
            transform:
              "translateX(-50%)",
            zIndex: 50000,
            width:
              "min(92vw, 390px)",
            boxSizing:
              "border-box",
            padding:
              "14px 16px",
            borderRadius:
              "18px",
            border:
              "1px solid rgba(255,0,255,0.52)",
            background:
              "linear-gradient(145deg, rgba(38,8,43,0.98), rgba(8,18,31,0.98))",
            boxShadow:
              "0 18px 60px rgba(0,0,0,0.48), 0 0 34px rgba(255,0,255,0.28)",
            color:
              "#FFFFFF",
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              color:
                MAGENTA,
              fontSize:
                "11px",
              fontWeight:
                900,
              letterSpacing:
                "0.12em",
              textTransform:
                "uppercase",
              marginBottom:
                "5px",
            }}
          >
            ● Hospes · misión activa
          </div>

          <div
            style={{
              color:
                "rgba(255,255,255,0.88)",
              fontSize:
                "13px",
              lineHeight:
                1.45,
            }}
          >
            {launchNotice}
          </div>
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: "340px",
          boxSizing:
            "border-box",
          display: "flex",
          flexDirection:
            "column",
          padding: "18px",
          borderRadius:
            Theme.Radius.medium,
          border:
            "1px solid rgba(255,0,255,0.18)",
          background:
            "linear-gradient(145deg, rgba(24,18,32,0.98), rgba(8,10,20,0.98))",
          boxShadow:
            "0 16px 36px rgba(0,0,0,0.24)",
          color:
            Theme.Colors.text,
        }}
      >
        {isThisMissionActive ? (
          <>
            <p
              style={{
                margin:
                  "0 0 5px",
                color:
                  MAGENTA,
                fontSize:
                  "11px",
                fontWeight:
                  900,
                letterSpacing:
                  "0.12em",
                textTransform:
                  "uppercase",
                textAlign:
                  "center",
              }}
            >
              ● Misión activa
            </p>

            <h3
              style={{
                margin:
                  "0 0 8px",
                color:
                  "#FFFFFF",
                textAlign:
                  "center",
                fontSize:
                  "19px",
              }}
            >
              {
                recommendedExperience
                  ?.title
              }
            </h3>

            <p
              style={{
                margin:
                  "0 0 14px",
                color:
                  "rgba(255,255,255,0.70)",
                textAlign:
                  "center",
                lineHeight:
                  1.5,
                fontSize:
                  "13px",
              }}
            >
              Qué bueno que comenzaste. Hospes ya está acompañando tu recorrido y te avisará cuando llegues.
            </p>

            <button
              type="button"
              onClick={
                handleOpenJourney
              }
              style={{
                width: "100%",
                minHeight:
                  "46px",
                border: "none",
                borderRadius:
                  "13px",
                background:
                  `linear-gradient(135deg, ${MAGENTA}, #D900B8)`,
                color:
                  "#FFFFFF",
                fontWeight:
                  800,
                fontSize:
                  "14px",
                cursor:
                  "pointer",
                boxShadow:
                  "0 7px 22px rgba(255,0,255,0.25)",
              }}
            >
              Ver recorrido →
            </button>
          </>
        ) : (
          <>
            <h3
              style={{
                margin:
                  "0 0 6px",
                color:
                  Theme.Colors.primary,
                textAlign:
                  "center",
                width:
                  "100%",
                fontSize:
                  "16px",
              }}
            >
              {decision.title}
            </h3>

            <p
              style={{
                margin:
                  "0 0 14px",
                fontSize:
                  "14px",
                lineHeight:
                  1.5,
                textAlign:
                  "center",
                width:
                  "100%",
                color:
                  Theme.Colors.textSoft,
              }}
            >
              {
                decision.message
              }
            </p>

            <button
              type="button"
              className="ig-hover"
              onClick={
                handleAction
              }
              style={{
                width: "100%",
                minHeight:
                  "46px",
                padding:
                  "10px 20px",
                borderRadius:
                  Theme.Radius.medium,
                border: "none",
                background:
                  isExperienceAction
                    ? `linear-gradient(135deg, ${MAGENTA}, #D900B8)`
                    : Theme.Colors.primary,
                color:
                  "#FFFFFF",
                fontWeight:
                  800,
                fontSize:
                  "14px",
                cursor:
                  "pointer",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                boxShadow:
                  isExperienceAction
                    ? "0 7px 22px rgba(255,0,255,0.25)"
                    : `0 7px 22px rgba(57,231,255,0.12)`,
              }}
            >
              {isExperienceAction
                ? "Comenzar misión →"
                : decision.action.label ??
                  "Ver el plan →"}
            </button>

            {isExperienceAction && (
              <div
                style={{
                  marginTop:
                    "8px",
                  color:
                    CYAN,
                  fontSize:
                    "10px",
                  textAlign:
                    "center",
                  opacity:
                    0.75,
                }}
              >
                Un toque activa GPS, recorrido y aviso de llegada.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default HospesActionCard;