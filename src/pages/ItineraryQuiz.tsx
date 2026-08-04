import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ItineraryAnswers } from "../types/itinerary";
import { buildItinerary } from "../engine/itineraryEngine";
import { Theme } from "../styles/theme";
import { loadUserProfile } from "../data/user";

const steps = [
  {
    key: "duration",
    question: "¿Cuántos días estarás?",
    options: [
      { value: "today", label: "Solo hoy" },
      { value: "2days", label: "2 días" },
      { value: "3days", label: "3 días" },
      { value: "week", label: "Una semana" },
    ],
  },
  {
    key: "companions",
    question: "¿Con quién viajas?",
    options: [
      { value: "solo", label: "Solo" },
      { value: "couple", label: "En pareja" },
      { value: "friends", label: "Con amigos" },
      { value: "family", label: "En familia" },
    ],
  },
  {
    key: "budget",
    question: "¿Cuál es tu presupuesto?",
    options: [
      { value: "budget", label: "Económico" },
      { value: "mid", label: "Medio" },
      { value: "premium", label: "Premium" },
    ],
  },
  {
    key: "priority",
    question: "¿Qué quieres priorizar?",
    options: [
      { value: "gastronomy", label: "Comer" },
      { value: "photography", label: "Fotografiar" },
      { value: "adventure", label: "Aventura" },
      { value: "family", label: "Cultura" },
      { value: "nightlife", label: "Vida nocturna" },
    ],
  },
  {
    key: "pace",
    question: "¿Cuánto caminas normalmente?",
    options: [
      { value: "low", label: "Poco" },
      { value: "medium", label: "Medio" },
      { value: "high", label: "Mucho" },
    ],
  },
  {
    key: "hasCar",
    question: "¿Usas automóvil?",
    options: [
      { value: "true", label: "Sí" },
      { value: "false", label: "No" },
    ],
  },
  {
    key: "timeOfDay",
    question: "¿Qué horario prefieres?",
    options: [
      { value: "morning", label: "Mañana" },
      { value: "afternoon", label: "Tarde" },
      { value: "night", label: "Noche" },
    ],
  },
];

function ItineraryQuiz() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<ItineraryAnswers>>({});
  const navigate = useNavigate();

  const currentStep = steps[stepIndex];

  const handleAnswer = (value: string) => {
    const parsedValue = value === "true" ? true : value === "false" ? false : value;
    const updated = { ...answers, [currentStep.key]: parsedValue };
    setAnswers(updated);

    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
  const finalAnswers = updated as ItineraryAnswers;

  const profile = loadUserProfile();

  const context = {
    profile,
    answers: finalAnswers,
  };

  const route = buildItinerary(context);

  sessionStorage.setItem(
    "iguide_itinerary_result",
    JSON.stringify(route)
  );

  navigate("/itinerario/resultado");
    }
  };

  return (
    <div style={{ backgroundColor: Theme.Colors.background, minHeight: "100vh", padding: Theme.Space.lg }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <p style={{ color: Theme.Colors.textSoft, fontSize: "13px" }}>
          Pregunta {stepIndex + 1} de {steps.length}
        </p>

        <h1 style={{ color: Theme.Colors.text, fontFamily: Theme.Typography.title, marginBottom: Theme.Space.lg }}>
          {currentStep.question}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: Theme.Space.sm }}>
          {currentStep.options.map((option) => (
            <button
              key={option.value}
              className="ig-hover"
              onClick={() => handleAnswer(option.value)}
              style={{
                padding: "16px",
                borderRadius: Theme.Radius.medium,
                border: `1px solid ${Theme.Colors.textSoft}33`,
                backgroundColor: Theme.Colors.surface,
                color: Theme.Colors.text,
                fontSize: "15px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ItineraryQuiz;