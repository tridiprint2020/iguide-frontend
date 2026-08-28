import {
  useEffect,
  useRef,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  recordPilotQrOpened,
} from "../repository/pilotTelemetryRepository";

import {
  tx,
} from "../i18n";

export default function PilotQrLanding() {
  const navigate = useNavigate();
  const { sourceCode } = useParams();
  const capturedRef = useRef(false);

  useEffect(() => {
    if (capturedRef.current) {
      return;
    }

    capturedRef.current = true;
    recordPilotQrOpened(sourceCode);

    navigate("/", {
      replace: true,
    });
  }, [navigate, sourceCode]);

  return (
    <main
      role="status"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#05060B",
        color: "#FFFFFF",
      }}
    >
      {tx("Preparando I.GUIDE…")}
    </main>
  );
}
