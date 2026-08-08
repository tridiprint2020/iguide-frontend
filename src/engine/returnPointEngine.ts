export type SavedReturnPoint = {
  lat: number;
  lng: number;
  label: string;
  savedAt: number;
};

const RETURN_POINT_KEY = "iguide-return-point";

function isSavedReturnPoint(
  value: unknown
): value is SavedReturnPoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Partial<SavedReturnPoint>;

  return (
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng) &&
    typeof point.label === "string" &&
    typeof point.savedAt === "number"
  );
}

export function loadReturnPoint(): SavedReturnPoint | null {
  const raw = localStorage.getItem(RETURN_POINT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isSavedReturnPoint(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveReturnPoint(
  lat: number,
  lng: number,
  label = "Mi hotel / punto de regreso"
): SavedReturnPoint {
  const point: SavedReturnPoint = {
    lat,
    lng,
    label,
    savedAt: Date.now(),
  };

  localStorage.setItem(
    RETURN_POINT_KEY,
    JSON.stringify(point)
  );

  return point;
}
