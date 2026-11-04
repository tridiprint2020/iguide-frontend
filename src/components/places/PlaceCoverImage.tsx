import type { CSSProperties } from "react";
import type { Experience } from "../../types/experience";
import { usePlaceCoverImage } from "../../hooks/usePlaceCover";

export default function PlaceCoverImage({ place, style }: { place: Experience; style?: CSSProperties }) {
  const { src, alt, onError } = usePlaceCoverImage(place);
  if (!src) return null;
  return <img src={src} alt={alt || place.title} loading="lazy" onError={onError}
    style={{ display: "block", width: "100%", height: 200, objectFit: "cover", borderRadius: 16, ...style }} />;
}
