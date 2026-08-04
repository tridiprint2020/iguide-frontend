import { useNavigate } from "react-router-dom";
import { useJourney } from "../../context/JourneyContext";

export default function ActiveJourneyBubble() {
  const navigate = useNavigate();
  const { journey } = useJourney();

  const experience = journey.experience;

  const hasActiveJourney =
    experience !== null &&
    journey.state !== "IDLE" &&
    journey.state !== "COMPLETED";

  if (!hasActiveJourney) {
    return null;
  }

  function handleOpenJourney() {
    if (!experience) {
      return;
    }

    navigate(`/expedition/${experience.slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenJourney}
        aria-label={`Continuar recorrido hacia ${experience.title}`}
        title={`Misión activa: ${experience.title}`}
        style={{
          position: "fixed",
          right: "18px",
          bottom: "84px",
          zIndex: 9999,
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.92)",
          background:
            "linear-gradient(145deg, #FF007A 0%, #C90061 100%)",
          color: "#FFFFFF",
          boxShadow:
            "0 10px 30px rgba(255, 0, 122, 0.42)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: "27px",
            lineHeight: 1,
          }}
        >
          🧭
        </span>

        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            width: "17px",
            height: "17px",
            borderRadius: "50%",
            backgroundColor: "#41E28A",
            border: "3px solid #FFFFFF",
          }}
        />

        <span
          aria-hidden="true"
          className="active-journey-pulse"
        />
      </button>

      <div
        style={{
          position: "fixed",
          right: "18px",
          bottom: "52px",
          zIndex: 9998,
          maxWidth: "190px",
          padding: "6px 10px",
          borderRadius: "999px",
          backgroundColor: "rgba(10,10,10,0.92)",
          color: "#FFFFFF",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          boxShadow:
            "0 5px 18px rgba(0,0,0,0.28)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Misión activa · {experience.title}
      </div>

      <style>
        {`
          @keyframes activeJourneyPulse {
            0% {
              transform: scale(0.82);
              opacity: 0.75;
            }

            70% {
              transform: scale(1.55);
              opacity: 0;
            }

            100% {
              transform: scale(1.55);
              opacity: 0;
            }
          }

          .active-journey-pulse {
            position: absolute;
            inset: -7px;
            border: 3px solid rgba(255, 0, 122, 0.65);
            border-radius: 50%;
            pointer-events: none;
            animation: activeJourneyPulse 1.8s ease-out infinite;
          }
        `}
      </style>
    </>
  );
}