export type ItineraryDuration = "today" | "2days" | "3days" | "week";
export type ItineraryCompanions = "solo" | "couple" | "friends" | "family";
export type ItineraryBudget = "budget" | "mid" | "premium";
export type ItineraryPace = "low" | "medium" | "high";
export type ItineraryTime = "morning" | "afternoon" | "night";

export interface ItineraryAnswers {
  duration: ItineraryDuration;
  companions: ItineraryCompanions;
  budget: ItineraryBudget;
  priority: string; // reutiliza tus Interest existentes
  pace: ItineraryPace;
  hasCar: boolean;
  timeOfDay: ItineraryTime;
}