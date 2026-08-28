import {
  useEffect,
} from "react";

import {
  configurePilotTelemetryCohort,
  flushPilotEvents,
} from "../../repository/pilotTelemetryRepository";

export function PilotTelemetryBootstrap() {
  useEffect(() => {
    const handleOnline = () => {
      void flushPilotEvents();
    };

    configurePilotTelemetryCohort();
    void flushPilotEvents();

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, []);

  return null;
}
