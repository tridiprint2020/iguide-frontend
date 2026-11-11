export const collectibleCollections = [
  { id: "mantaro", place: "Valle del Mantaro", title: "Coleccionables del Valle" },
  { id: "lima", place: "Lima", title: "Coleccionables de Lima" },
] as const;

export type CollectionId = typeof collectibleCollections[number]["id"];

export interface CollectibleSticker {
  id: string;
  collectionId: CollectionId;
  name: string;
  image: string;
  place: string;
  venue: string;
  sourceUrl: string;
  /** Assigned once the place and its mission have been verified in the catalogue. */
  experienceId?: string;
}

export const collectibleStickers: readonly CollectibleSticker[] = [
  {
    id: "mate-burilado",
    collectionId: "mantaro",
    name: "Mate burilado",
    image: "/images/collectibles/mate-burilado.webp",
    place: "Cochas Chico · El Tambo",
    venue: "La Casa de los Mates Burilados",
    sourceUrl: "https://www.facebook.com/LaCasadelosMatesBurilados",
  },
  {
    id: "telar-wanka",
    collectionId: "mantaro",
    name: "Telar wanka",
    image: "/images/collectibles/telar-wanka.webp",
    place: "Hualhuas · Valle del Mantaro",
    venue: "Inka Roca",
    sourceUrl: "https://www.facebook.com/inkaroca",
  },
];

export function getStickerCollection(visitedExperiences: readonly string[], collectionId?: CollectionId) {
  const completed = new Set(visitedExperiences);
  return collectibleStickers
    .filter((sticker) => !collectionId || sticker.collectionId === collectionId)
    .map((sticker) => ({
      ...sticker,
      collected: Boolean(sticker.experienceId && completed.has(sticker.experienceId)),
    }));
}
