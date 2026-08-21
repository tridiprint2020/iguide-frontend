import {
  getAppLanguage,
  tx,
} from "../i18n";

import type {
  Experience,
  ListingStatus,
  PlaceCategory,
} from "../types/experience";

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
 * Presentación central de la calificación pública.
 *
 * Los hoteles usan únicamente su clasificación oficial verificada. Si no
 * existe, la línea completa se omite. El resto conserva el Índice I.GUIDE
 * (escala 1.0–10.0) y el estado explícito "Sin calificación".
 */
export function getListingRatingLabel(
  experience: Experience
): string | null {
  const placeCategory =
    experience.placeCategory ??
    experience.type;

  if (placeCategory === "hotel") {
    const officialStars =
      experience.type === "hotel"
        ? experience.officialStars
        : undefined;

    if (
      typeof officialStars !== "number" ||
      !Number.isInteger(officialStars) ||
      officialStars < 1 ||
      officialStars > 5
    ) {
      return null;
    }

    return tx("Clasificación oficial: {{stars}}", {
      stars: "★".repeat(officialStars),
    });
  }

  const { rating } = experience;

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
