import { Navigation, Radar } from "lucide-react";

export default function NearbyIcon() {
  return (
    <span aria-hidden="true" style={{ position: "relative", display: "grid", placeItems: "center", width: 32, height: 32 }}>
      <Radar size={32} strokeWidth={1.4} color="#00E6FF" />
      <Navigation size={15} strokeWidth={1.8} color="#FF3DE8" fill="#FF3DE833" style={{ position: "absolute" }} />
    </span>
  );
}
