import type { CSSProperties } from "react";
import type { Experience } from "../../types/experience";
import { usePlaceCoverImage } from "../../hooks/usePlaceCover";

type PlaceCoverImageProps = {
  place: Experience;
  matchPublishedFrame?: boolean;
  style?: CSSProperties;
};

export default function PlaceCoverImage({ place, matchPublishedFrame = false, style }: PlaceCoverImageProps) {
  const { src, alt, isPublished, onError } = usePlaceCoverImage(place);
  if (!src) return null;
  const preserveFrame = matchPublishedFrame && isPublished;
  return (
    <img src={src} alt={alt || place.title} loading="lazy" onError={onError}
      style={{
        display: "block",
        width: "100%",
        height: preserveFrame ? "auto" : 200,
        aspectRatio: preserveFrame ? "16 / 9" : undefined,
        objectFit: "cover",
        borderRadius: 16,
        ...style,
      }} />
  );
}
