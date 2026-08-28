import {
  useEffect,
} from "react";

import {
  flushPilotEvents,
} from "../../repository/pilotTelemetryRepository";

export function PilotTelemetryBootstrap() {
  useEffect(() => {
    const handleOnline = () => {
      void flushPilotEvents();
    };

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
