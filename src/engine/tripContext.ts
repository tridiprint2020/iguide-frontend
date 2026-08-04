import type { Interest } from "../types/interest";

let currentInterest: Interest = "photography";
let hasBeenSet = false;

export function setInterest(interest: Interest) {
  currentInterest = interest;
  hasBeenSet = true;
}

export function getInterest(): Interest {
  return currentInterest;
}

export function hasInterestBeenSet(): boolean {
  return hasBeenSet;
}