export type Difficulty = "easy" | "medium" | "high";

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Moderada",
  high: "Alta",
};

export const difficultyColors: Record<Difficulty, string> = {
  easy: "#4CAF50",
  medium: "#FF9800",
  high: "#F44336",
};