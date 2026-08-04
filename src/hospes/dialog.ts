import {
  greetings,
  recommendationOpeners,
  weatherWarnings,
  progressEncouragements,
  closingLines,
} from "./phrases";

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function getGreeting() {
  return pickRandom(greetings);
}

export function getRecommendationOpener() {
  return pickRandom(recommendationOpeners);
}

export function getWeatherWarning() {
  return pickRandom(weatherWarnings);
}

export function getProgressMessage() {
  return pickRandom(progressEncouragements);
}

export function getClosingLine() {
  return pickRandom(closingLines);
}