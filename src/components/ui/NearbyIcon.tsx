import { Navigation, Radar } from "lucide-react";

export default function NearbyIcon() {
  return (
    <span aria-hidden="true" style={{ position: "relative", display: "grid", placeItems: "center", width: 25, height: 25 }}>
      <Radar size={25} strokeWidth={1.55} color="currentColor" />
      <Navigation size={12} strokeWidth={1.8} color="#FF3DE8" fill="#FF3DE833" style={{ position: "absolute" }} />
    </span>
  );
}
