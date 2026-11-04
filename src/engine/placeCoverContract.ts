export const PLACE_COVER_BUCKET = "iguide-place-covers";
export const MAX_COVER_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTO_INPUT_BYTES = 12 * 1024 * 1024;
const PLACE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;
const PHOTO_PATH = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}\/[a-f0-9-]{36}\.jpg$/;

export type PublishedPlaceCover = {
  experience_id: string;
  object_path: string;
  alt_text: string;
  updated_at: string;
};

export function assertPlaceId(id: string): void {
  if (!PLACE_ID.test(id)) throw new Error("Elige un local válido.");
}

export function assertPhotoInput(file: Pick<File, "type" | "size">): void {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Elige una fotografía JPG, PNG o WebP.");
  }
  if (file.size <= 0 || file.size > MAX_PHOTO_INPUT_BYTES) {
    throw new Error("La fotografía debe pesar entre 1 byte y 12 MB.");
  }
}

export function parsePublishedCovers(value: unknown): PublishedPlaceCover[] {
  if (!Array.isArray(value)) throw new Error("No se pudieron leer las portadas.");
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Portada no válida.");
    const row = item as Record<string, unknown>;
    if (typeof row.experience_id !== "string" || !PLACE_ID.test(row.experience_id) ||
      typeof row.object_path !== "string" || !PHOTO_PATH.test(row.object_path) ||
      !row.object_path.startsWith(`${row.experience_id}/`) ||
      typeof row.alt_text !== "string" || !row.alt_text.trim() || row.alt_text.length > 160 ||
      typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at))) {
      throw new Error("No se pudieron validar las portadas recibidas.");
    }
    return {
      experience_id: row.experience_id, object_path: row.object_path,
      alt_text: row.alt_text, updated_at: row.updated_at,
    };
  });
}

export function publicCoverUrl(projectUrl: string, path: string): string {
  if (!PHOTO_PATH.test(path)) throw new Error("Ruta de fotografía no válida.");
  return `${projectUrl}/storage/v1/object/public/${PLACE_COVER_BUCKET}/${path}`;
}

const INCORPORATED_PHOTOS: Record<string, string> = {
  "detras-de-la-catedral": "/images/restaurants/detras-de-la-catedral.jpg",
  "el-olimpico": "/images/restaurants/el-olimpico.jpg",
  bicho: "/images/cafes/bicho.jpg",
  "cerrito-libertad": "/images/expeditions/cerrito.jpg",
  "torre-torre": "/images/expeditions/torretorre.jpg",
  huaytapallana: "/images/expeditions/huaytapallana.jpg",
  "hotel-unu": "/images/hotels/hotel-unu.jpg",
};

export type PlaceWithImage = {
  experienceId: string; slug: string; image: string; coverImage: string;
};

export function incorporatedPlaceCover(place: PlaceWithImage): string | undefined {
  return INCORPORATED_PHOTOS[place.slug] ||
    [place.image, place.coverImage].find(value => value && !/logo|placeholder/i.test(value));
}
