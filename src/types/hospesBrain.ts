export type ActionType =
  | "open-category"
  | "open-experience"
  | "start-journey"
  | "open-itinerary"
  | "open-map";

export interface HospesAction {
  type: ActionType;
  target: string;
  label: string;
}

export type Priority = "weather" | "time" | "progress" | "mood" | "default";

export interface HospesDecision {
  priority: Priority;
  title: string;
  message: string;
  action: HospesAction;
}
