import type { Experience } from "../types/experience";
import type { WeatherStatus } from "./weatherEngine";
import { getExperienceSafetyReason } from "./experienceSafetyEngine";
import { getExperienceOpeningStatus, getScheduleReadiness } from "./experienceScheduleEngine";

const safetyMessages = {
  inactive: "Este lugar ya no está disponible para iniciar una misión.",
  "weather-wet-risk": "No puedes iniciar esta misión con lluvia o riesgo de humedad. Elige una alternativa bajo techo.",
  "weather-unknown-risk": "No podemos confirmar el clima para este recorrido sensible. Inténtalo cuando haya información disponible.",
  "high-mountain-weather": "Las condiciones actuales no permiten iniciar una misión de alta montaña.",
  "night-incompatible": "Este recorrido no es compatible con una salida nocturna. Elige otra experiencia.",
};

export function getMissionStartDecision(experience: Experience, weather: WeatherStatus | null, now: Date):
  { kind: "allow" } | { kind: "block" | "confirm"; message: string } {
  const reason = getExperienceSafetyReason(experience, weather, now);
  if (reason) return { kind: "block", message: safetyMessages[reason] };
  if (experience.type === "expedition" && experience.advancePlanning) {
    return { kind: "block", message: "Esta salida requiere planificación previa. Consulta la ficha y organiza el viaje antes de iniciar una misión." };
  }
  const readiness = getScheduleReadiness(experience);
  if (readiness !== "ready") return { kind: "confirm", message: readiness === "variable"
    ? "El horario o punto de esta experiencia es variable. No podemos confirmar que esté disponible ahora. ¿Quieres iniciar el recorrido de todos modos?"
    : "El horario de este lugar no está verificado. No podemos confirmar que esté abierto. ¿Quieres iniciar el recorrido de todos modos?" };
  if (!getExperienceOpeningStatus(experience, now).isOpen) {
    return { kind: "confirm", message: "Este lugar está cerrado según su horario publicado. Puedes acercarte a verlo por fuera; no se garantiza atención. ¿Quieres iniciar el recorrido?" };
  }
  return { kind: "allow" };
}

// Run before any GPS, track, storage or active-journey mutation.
export function authorizeMissionStart(
  experience: Experience, weather: WeatherStatus | null, now: Date,
  dialog: { block: (message: string) => void; confirm: (message: string) => boolean },
): boolean {
  const decision = getMissionStartDecision(experience, weather, now);
  if (decision.kind === "block") { dialog.block(decision.message); return false; }
  return decision.kind === "allow" || dialog.confirm(decision.message);
}
