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
};

const LISTING_STATUS_LABELS: Record<
  ListingStatus,
  string
> = {
  editorial: "Selección I.GUIDE",
  pilot_partner: "Aliado piloto",
  sponsored: "Patrocinado",
};

export function getMemoryCardDescriptor(
  placeCategory?: PlaceCategory,
  listingStatus: ListingStatus = "editorial"
): string {
  const categoryLabel = tx(
    placeCategory
      ? PLACE_CATEGORY_LABELS[placeCategory]
      : "Experiencia"
  );

  const statusLabel = tx(
    LISTING_STATUS_LABELS[listingStatus]
  );

  return `${categoryLabel} · ${statusLabel}`.toLocaleUpperCase(
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE"
  );
}
