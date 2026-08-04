/**
 * ============================================================
 * MIGRACIÓN INCREMENTAL — CORE DEFINITIVO (Constitución v2.0)
 *
 * El timeline[] es la única fuente de verdad y el origen
 * absoluto de todo el recorrido de I.GUIDE.
 * ============================================================
 */

export type TimelineItemType =
  | "start"
  | "walk"
  | "memory"
  | "abort"
  | "finish";
  
export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  lat: number;
  lng: number;
  timestamp: number;
  note?: string;
  photo?: string;
  audio?: string;
}

export interface ExpeditionTrack {
  experienceId: string;
  sessionId: string;
  startedAt: number;
  completedAt?: number;
  timeline: TimelineItem[];
}

export type CompletionReason = "distance" | "gps" | "destination" | "timeline";

export interface CompletionResult {
  success: boolean;
  reason?: CompletionReason;
  message: string; // Explicación oficial amigable en español dictada por Hospes
}
