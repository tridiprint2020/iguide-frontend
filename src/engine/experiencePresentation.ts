import {
  getAppLanguage,
  tx,
} from "../i18n";

import type {
  ListingStatus,
  PlaceCategory,
} from "../types/experience/experience";

const PLACE_CATEGORY_LABELS: Record<
  PlaceCategory,
  string
> = {
  expedition: "Expedición",
  restaurant: "Restaurante",
  cafe: "Cafetería",
  bar: "Bar",
  nightclub: "Discoteca",
  hotel: "Hotel",
  museum: "Museo",
  festival: "Festival",
  craft: "Artesanía",
  event: "Evento",
  icecream_shop: "Heladería",
  art_experience: "Arte y experiencias",
};

const LISTING_STATUS_LABELS: Record<
  ListingStatus,
  string
> = {
  editorial: "Selección I.GUIDE",
  pilot_partner: "Aliado piloto",
  sponsored: "Patrocinado",
  access_point: "Punto de acceso I.GUIDE",
};

/**
 * Integridad comercial: sin listingStatus explícito NO se
 * muestra ningún sello. "Selección I.GUIDE" es una curaduría
 * que se otorga en datos, jamás un default de presentación.
 */
export function getMemoryCardDescriptor(
  placeCategory?: PlaceCategory,
  listingStatus?: ListingStatus
): string {
  const locale =
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE";

  const categoryLabel = tx(
    placeCategory
      ? PLACE_CATEGORY_LABELS[placeCategory]
      : "Experiencia"
  );

  if (!listingStatus) {
    return categoryLabel.toLocaleUpperCase(
      locale
    );
  }

  const statusLabel = tx(
    LISTING_STATUS_LABELS[listingStatus]
  );

  return `${categoryLabel} · ${statusLabel}`.toLocaleUpperCase(
    locale
  );
}

/**
 * Puntuación oficial I.GUIDE (escala 1.0–10.0, un decimal).
 * Sin dato o fuera de escala: "Sin calificación" / "Not rated".
 * Nunca muestra 0.0, nunca inventa ni convierte valores.
 */
export function getListingRatingLabel(
  rating?: number
): string {
  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 10
  ) {
    return tx("Sin calificación");
  }

  return tx("Puntuación I.GUIDE: {{value}}", {
    value: rating.toFixed(1),
  });
}
