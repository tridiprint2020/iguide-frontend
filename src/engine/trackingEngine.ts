import { catalog } from "../data/catalog";

import type {
  ExpeditionTrack,
  TimelineItem,
  CompletionResult,
} from "../types/tracking/tracking";
import { tx } from "../i18n";

// =======================================================================
// 🏛️ 1. UTILIDADES INTERNAS Y ACCESO A PERSISTENCIA
// =======================================================================

type ActiveTrackPointer = {
  sessionId: string;
};

const trackCache = new Map<string, ExpeditionTrack>();

function getActiveTrackKey(experienceId: string): string {
  return `iguide_track_${experienceId}`;
}

function getSessionTrackKey(
  experienceId: string,
  sessionId: string
): string {
  return `iguide_track_${experienceId}_${sessionId}`;
}

function getSessionIndexKey(experienceId: string): string {
  return `iguide_sessions_${experienceId}`;
}

function getCacheKey(
  experienceId: string,
  sessionId: string
): string {
  return `${experienceId}:${sessionId}`;
}

function isActiveTrackPointer(
  value: unknown
): value is ActiveTrackPointer {
  if (
    typeof value !== "object" ||
    value === null ||
    !("sessionId" in value)
  ) {
    return false;
  }

  return (
    typeof (value as ActiveTrackPointer).sessionId === "string"
  );
}

function normalizeTrack(
  track: ExpeditionTrack,
  experienceId: string,
  fallbackSessionId?: string
): ExpeditionTrack {
  return {
    ...track,
    experienceId:
      track.experienceId || experienceId,
    sessionId:
      track.sessionId ||
      fallbackSessionId ||
      String(track.startedAt || Date.now()),
    startedAt:
      track.startedAt || Date.now(),
    timeline: Array.isArray(track.timeline)
      ? track.timeline
      : [],
  };
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

function compactTimeline(
  timeline: TimelineItem[]
): TimelineItem[] {
  const compacted: TimelineItem[] = [];

  for (const item of timeline) {
    const normalizedItem: TimelineItem = {
      ...item,
      lat: roundCoordinate(item.lat),
      lng: roundCoordinate(item.lng),
    };

    if (!normalizedItem.note) {
      delete normalizedItem.note;
    }

    if (!normalizedItem.photo) {
      delete normalizedItem.photo;
    }

    if (!normalizedItem.audio) {
      delete normalizedItem.audio;
    }

    const previous =
      compacted[compacted.length - 1];

    /*
     * Evita duplicados GPS idénticos consecutivos.
     * Conserva siempre memorias, inicio, abandono y final.
     */
    if (
      normalizedItem.type === "walk" &&
      previous?.type === "walk" &&
      previous.lat === normalizedItem.lat &&
      previous.lng === normalizedItem.lng
    ) {
      continue;
    }

    compacted.push(normalizedItem);
  }

  return compacted;
}

function prepareTrackForStorage(
  track: ExpeditionTrack
): ExpeditionTrack {
  return {
    ...track,
    timeline: compactTimeline(track.timeline ?? []),
  };
}

function cacheTrack(track: ExpeditionTrack): void {
  trackCache.set(
    getCacheKey(
      track.experienceId,
      track.sessionId
    ),
    track
  );
}

function readTrackFromSessionStorage(
  experienceId: string,
  sessionId: string
): ExpeditionTrack | null {
  const cacheKey =
    getCacheKey(experienceId, sessionId);

  const cached =
    trackCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const raw = localStorage.getItem(
    getSessionTrackKey(
      experienceId,
      sessionId
    )
  );

  if (!raw) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(raw) as ExpeditionTrack;

    const normalized =
      normalizeTrack(
        parsed,
        experienceId,
        sessionId
      );

    cacheTrack(normalized);

    return normalized;
  } catch {
    return null;
  }
}

export function loadSessionIndex(
  experienceId: string
): string[] {
  const raw = localStorage.getItem(
    getSessionIndexKey(experienceId)
  );

  if (!raw) {
    return [];
  }

  try {
    const sessionIds =
      JSON.parse(raw) as unknown;

    if (!Array.isArray(sessionIds)) {
      return [];
    }

    return sessionIds.filter(
      (sessionId): sessionId is string =>
        typeof sessionId === "string"
    );
  } catch {
    return [];
  }
}

export function saveSessionIndex(
  experienceId: string,
  sessionIds: string[]
): void {
  const uniqueSessionIds =
    Array.from(new Set(sessionIds));

  localStorage.setItem(
    getSessionIndexKey(experienceId),
    JSON.stringify(uniqueSessionIds)
  );
}

export function registerSession(
  experienceId: string,
  sessionId: string
): void {
  const currentSessionIds =
    loadSessionIndex(experienceId);

  if (
    currentSessionIds.includes(sessionId)
  ) {
    return;
  }

  saveSessionIndex(experienceId, [
    ...currentSessionIds,
    sessionId,
  ]);
}

/**
 * Carga la sesión apuntada por la clave activa.
 *
 * También migra automáticamente el formato antiguo,
 * donde la clave activa contenía una segunda copia
 * completa del mismo recorrido.
 */
export function loadTrack(
  experienceId: string
): ExpeditionTrack | null {
  const activeKey =
    getActiveTrackKey(experienceId);

  const raw =
    localStorage.getItem(activeKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(raw) as
        | ActiveTrackPointer
        | ExpeditionTrack;

    if (isActiveTrackPointer(parsed)) {
      return readTrackFromSessionStorage(
        experienceId,
        parsed.sessionId
      );
    }

    /*
     * Migración automática:
     * 1. detecta la copia completa antigua;
     * 2. guarda una sola copia canónica por sesión;
     * 3. reemplaza la clave duplicada por un puntero pequeño.
     */
    const migratedTrack =
      normalizeTrack(
        parsed,
        experienceId
      );

    saveTrack(migratedTrack);

    return migratedTrack;
  } catch {
    return null;
  }
}

export function loadTrackSession(
  experienceId: string,
  sessionId: string
): ExpeditionTrack | null {
  return readTrackFromSessionStorage(
    experienceId,
    sessionId
  );
}

export function loadAllTrackSessions(
  experienceId: string
): ExpeditionTrack[] {
  const sessionIds =
    loadSessionIndex(experienceId);

  return sessionIds
    .map((sessionId) =>
      loadTrackSession(
        experienceId,
        sessionId
      )
    )
    .filter(
      (track): track is ExpeditionTrack =>
        track !== null
    )
    .sort(
      (a, b) =>
        b.startedAt - a.startedAt
    );
}

/**
 * Persistencia optimizada:
 *
 * - guarda el recorrido completo una sola vez;
 * - la clave compatible guarda únicamente sessionId;
 * - mantiene una caché en memoria para evitar JSON.parse repetido;
 * - compacta coordenadas y duplicados exactos.
 */
export function saveTrack(
  track: ExpeditionTrack
): void {
  const preparedTrack =
    prepareTrackForStorage(track);

  track.timeline =
    preparedTrack.timeline;

  const serializedTrack =
    JSON.stringify(preparedTrack);

  localStorage.setItem(
    getSessionTrackKey(
      preparedTrack.experienceId,
      preparedTrack.sessionId
    ),
    serializedTrack
  );

  localStorage.setItem(
    getActiveTrackKey(
      preparedTrack.experienceId
    ),
    JSON.stringify({
      sessionId:
        preparedTrack.sessionId,
    } satisfies ActiveTrackPointer)
  );

  registerSession(
    preparedTrack.experienceId,
    preparedTrack.sessionId
  );

  cacheTrack(preparedTrack);
}

/**
 * Elimina solo el puntero activo.
 * El historial por sesión permanece disponible.
 */
export function deleteTrack(
  experienceId: string
): void {
  localStorage.removeItem(
    getActiveTrackKey(experienceId)
  );
}

export function clearTrackingCache(): void {
  trackCache.clear();
}

export function deleteTrackSession(
  experienceId: string,
  sessionId: string
): void {
  localStorage.removeItem(
    getSessionTrackKey(
      experienceId,
      sessionId
    )
  );

  trackCache.delete(
    getCacheKey(
      experienceId,
      sessionId
    )
  );

  saveSessionIndex(
    experienceId,
    loadSessionIndex(experienceId).filter(
      (storedSessionId) =>
        storedSessionId !== sessionId
    )
  );

  const activeRaw =
    localStorage.getItem(
      getActiveTrackKey(experienceId)
    );

  if (!activeRaw) {
    return;
  }

  try {
    const active =
      JSON.parse(activeRaw) as unknown;

    if (
      isActiveTrackPointer(active) &&
      active.sessionId === sessionId
    ) {
      localStorage.removeItem(
        getActiveTrackKey(experienceId)
      );
    }
  } catch {
    localStorage.removeItem(
      getActiveTrackKey(experienceId)
    );
  }
}

// Helper de dominio puro para estandarizar ítems cronológicos sanado
function createTimelineItem(
  id: string,
type:
  | "start"
  | "walk"
  | "memory"
  | "abort"
  | "finish",
  latitude: number,
  longitude: number,
  timestamp: number,
  extras?: {
    note?: string;
    photo?: string;
    audio?: string;
  }
): TimelineItem {
  return {
    id,
    type,
    lat: latitude, 
    lng: longitude,
    timestamp,
    ...extras,
  };
}

// Fórmula de Haversine para cálculo preciso de distancia geofísica entre puntos (en kilómetros)
function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// =======================================================================
// 📈 2. MOTOR DE ESTADÍSTICAS DERIVADAS (Responsabilidad Única)
// =======================================================================

export interface JourneyStats {
  totalPhotos: number;
  totalNotes: number;
  totalMemories: number;
  totalDistanceKm: number;
  durationSeconds: number;
  lastPhoto?: string;
  lastNote?: string;
}

/**
 * 📊 RESPONSABILIDAD ÚNICA: Matemáticas solamente.
 * Procesa la telemetría pura a partir de un vector cronológico inmutable.
 * No sabe qué es LocalStorage, ni qué es una interfaz, ni qué es un experienceId.
 */
export function getJourneyStats(
  timeline: TimelineItem[],
  startedAt: number
): JourneyStats {
  const defaultStats: JourneyStats = {
    totalPhotos: 0,
    totalNotes: 0,
    totalMemories: 0,
    totalDistanceKm: 0,
    durationSeconds: 0,
  };

  if (!timeline || timeline.length === 0) {
    return defaultStats;
  }

  let totalPhotos = 0;
  let totalNotes = 0;
  let totalMemories = 0;
  let totalDistanceKm = 0;
  let lastPhoto: string | undefined = undefined;
  let lastNote: string | undefined = undefined;

  // Procesar ítems secuencialmente para acumular recuerdos y distancia
  for (let i = 0; i < timeline.length; i++) {
    const current = timeline[i];

    if (current.type === "memory") {
      totalMemories++;
      if (current.photo) {
        totalPhotos++;
        lastPhoto = current.photo;
      }
      if (current.note) {
        totalNotes++;
        lastNote = current.note;
      }
    }

    // Acumular distancia geofísica entre nodos adyacentes del trayecto real
    if (i > 0) {
      const prev = timeline[i - 1];
      totalDistanceKm += calculateHaversineDistance(prev.lat, prev.lng, current.lat, current.lng);
    }
  }

  // Determinar tiempos de inicio y fin para la duración real transcurrida
  const startPoint = timeline.find((t) => t.type === "start");
  const finishPoint = timeline.find((t) => t.type === "finish");

  const finalStartTime = startPoint ? startPoint.timestamp : startedAt;
  const finalEndTime = finishPoint ? finishPoint.timestamp : Date.now();
  const durationSeconds = Math.max(0, Math.floor((finalEndTime - finalStartTime) / 1000));

  return {
    totalPhotos,
    totalNotes,
    totalMemories,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)), // Redondeo limpio para la UI
    durationSeconds,
    lastPhoto,
    lastNote,
  };
}

/**
 * 💾 RESPONSABILIDAD ÚNICA: Puente de Persistencia.
 * Carga el track del dispositivo y delega el cálculo matemático al motor puro.
 */
export function getJourneyStatsFromTrack(experienceId: string): JourneyStats {
  const track = loadTrack(experienceId);
  
  if (!track) {
    return {
      totalPhotos: 0,
      totalNotes: 0,
      totalMemories: 0,
      totalDistanceKm: 0,
      durationSeconds: 0,
    };
  }

  return getJourneyStats(
    track.timeline || [],
    track.startedAt || Date.now()
  );
}


// =======================================================================
// 🔮 3. ACCIONES DEL CICLO DE VIDA DEL RASTREO
// =======================================================================

export function startNewTrack(
  experienceId: string
): ExpeditionTrack {
  const startedAt = Date.now();
  const sessionId = String(startedAt);

  const track: ExpeditionTrack = {
    experienceId,
    sessionId,
    startedAt,
    timeline: [],
  };

  saveTrack(track);
  registerSession(experienceId, sessionId);

  return track;
}

export function createStartPoint(experienceId: string, lat: number, lng: number): ExpeditionTrack {
  const track = startNewTrack(experienceId);
  const id = crypto.randomUUID();
  const now = Date.now();

  track.timeline.push(createTimelineItem(id, "start", lat, lng, now));
  saveTrack(track);
  return track;
}

export function addPointToTrack(
  experienceId: string,
point: {
  lat: number;
  lng: number;
  timestamp: number;
  type:
    | "start"
    | "walk"
    | "memory"
    | "abort"
    | "finish";
}): ExpeditionTrack | null {
  const track = loadTrack(experienceId);
  if (!track) return null;

  const id = crypto.randomUUID();
  track.timeline.push(createTimelineItem(id, point.type, point.lat, point.lng, point.timestamp));
  saveTrack(track);
  return track;
}

export function addMemoryToTrack(
  experienceId: string,
  memory: { lat: number; lng: number; note?: string; photo?: string }
): void {
  const track = loadTrack(experienceId);
  if (!track) return;

  const id = crypto.randomUUID();
  const now = Date.now();

  track.timeline.push(
    createTimelineItem(id, "memory", memory.lat, memory.lng, now, {
      note: memory.note,
      photo: memory.photo,
    })
  );
  saveTrack(track);
}
export function updateMemoryNote(
  experienceId: string,
  memoryId: string,
  note: string
): ExpeditionTrack | null {
  const track = loadTrack(
    experienceId
  );

  if (!track) {
    console.warn(
      "No se encontró el recorrido para actualizar la nota:",
      experienceId
    );

    return null;
  }

  const memoryItem =
    track.timeline.find(
      (item) =>
        item.id === memoryId &&
        item.type === "memory"
    );

  if (!memoryItem) {
    console.warn(
      "No se encontró la memoria dentro del recorrido:",
      memoryId
    );

    return null;
  }

  const cleanNote =
    note.trim();

  if (cleanNote) {
    memoryItem.note =
      cleanNote;
  } else {
    delete memoryItem.note;
  }

  saveTrack(track);

  return track;
}
/**
 * Registra el punto donde el usuario decidió abandonar
 * una expedición sin certificarla como completada.
 */
export function addAbortPoint(
  experienceId: string,
  lat: number,
  lng: number
): ExpeditionTrack | null {
  const track = loadTrack(experienceId);

  if (!track) {
    return null;
  }

  const lastItem =
    track.timeline[track.timeline.length - 1];

  /*
   * Evita crear varios nodos abort si el usuario
   * pulsa el botón más de una vez.
   */
  if (lastItem?.type === "abort") {
    return track;
  }

  track.timeline.push(
    createTimelineItem(
      crypto.randomUUID(),
      "abort",
      lat,
      lng,
      Date.now()
    )
  );

  saveTrack(track);

  return track;
}


export function addFinishPoint(
  experienceId: string,
  lat: number,
  lng: number
): ExpeditionTrack | null {
  const track = loadTrack(experienceId);

  if (!track) {
    return null;
  }

  const alreadyHasFinish = track.timeline.some(
    (item) => item.type === "finish"
  );

  if (!alreadyHasFinish) {
    track.timeline.push(
      createTimelineItem(
        crypto.randomUUID(),
        "finish",
        lat,
        lng,
        Date.now()
      )
    );

    saveTrack(track);
  }

  return track;
}

/**
 * Marca oficialmente el recorrido como completado.
 * Solo debe llamarse después de canCompleteJourney().
 */
export function completeTrack(
  experienceId: string
): ExpeditionTrack | null {
  const track = loadTrack(experienceId);

  if (!track) {
    return null;
  }

  track.completedAt = Date.now();
  saveTrack(track);

  return track;
}

// =======================================================================
// 🤖 4. MOTOR DE VALIDACIÓN DE REGLAS DE NEGOCIO SANEADO
// =======================================================================
function isInsideCertificationArea(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number
): boolean {

  const distanceKm = calculateHaversineDistance(
    currentLat,
    currentLng,
    targetLat,
    targetLng
  );

  return distanceKm * 1000 <= radiusMeters;
}

/**
 * Respaldo de campo para catálogos cuyo pin comercial aún
 * necesita calibración. Solo se ejecuta por una acción
 * explícita del usuario y nunca amplía la llegada automática.
 */
export function certifyArrivalAtPosition(
  experienceId: string,
  currentLat: number,
  currentLng: number
): CompletionResult {
  const track =
    loadTrack(experienceId);

  if (!track) {
    return {
      success: false,
      reason: "timeline",
      message:
        tx("No se encontró una misión activa en este dispositivo."),
    };
  }

  const experience =
    catalog.find(
      (item) =>
        item.experienceId ===
        experienceId
    );

  if (!experience) {
    return {
      success: false,
      reason: "destination",
      message:
        tx("No se encontró el destino oficial."),
    };
  }

  const targetLatitude =
    experience.arrivalLatitude ??
    experience.latitude;

  const targetLongitude =
    experience.arrivalLongitude ??
    experience.longitude;

  const confirmationRadiusMeters =
    experience
      .manualCertificationRadiusMeters ??
    experience
      .certificationRadiusMeters ??
    25;

  if (
    !isInsideCertificationArea(
      currentLat,
      currentLng,
      targetLatitude,
      targetLongitude,
      confirmationRadiusMeters
    )
  ) {
    return {
      success: false,
      reason: "distance",
      message:
        tx("El GPS todavía te ubica fuera del área de {{radius}} m del destino.", { radius: confirmationRadiusMeters }),
    };
  }

  addFinishPoint(
    experienceId,
    currentLat,
    currentLng
  );

  return {
    success: true,
    message:
      tx("Llegada confirmada con tu ubicación actual."),
  };
}

export function canCompleteJourney(
  experienceId: string
): CompletionResult {
  const track =
    loadTrack(experienceId);

  if (!track) {
    return {
      success: false,
      reason: "timeline",
      message:
        tx("No se encontró una expedición activa en este dispositivo."),
    };
  }

  const experience =
    catalog.find(
      (item) =>
        item.experienceId ===
        experienceId
    );

  if (!experience) {
    return {
      success: false,
      reason: "destination",
      message:
        tx("No se pudo encontrar el destino oficial."),
    };
  }

  const finish =
    [...track.timeline]
      .reverse()
      .find(
        (item) =>
          item.type === "finish"
      );

  if (!finish) {
    return {
      success: false,
      reason: "gps",
      message:
        tx("Todavía no se ha registrado la llegada al destino."),
    };
  }

  const configuredRadiusMeters =
    experience
      .certificationRadiusMeters ??
    25;

  const targetLatitude =
    experience.arrivalLatitude ??
    experience.latitude;

  const targetLongitude =
    experience.arrivalLongitude ??
    experience.longitude;

  /*
   * La llegada manual solo amplía el radio cuando el
   * catálogo lo declara expresamente. Así dos locales
   * cercanos nunca comparten una tolerancia genérica.
   */
  const certificationRadiusMeters =
    experience
      .manualCertificationRadiusMeters ??
    configuredRadiusMeters;

  const inside =
    isInsideCertificationArea(
      finish.lat,
      finish.lng,
      targetLatitude,
      targetLongitude,
      certificationRadiusMeters
    );

  if (!inside) {
    return {
      success: false,
      reason: "distance",
      message:
        tx("La llegada quedó fuera del área de certificación de {{radius}} metros.", { radius: certificationRadiusMeters }),
    };
  }

  /*
   * RC2:
   * llegar físicamente es suficiente.
   *
   * Foto, nota, tiempo y distancia recorrida
   * son información adicional, no requisitos.
   */
  return {
    success: true,
    reason: "destination",
    message:
      tx("Llegada certificada en {{title}}.", { title: experience.title }),
  };
}
