import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";
import { JourneyProvider } from "./context/JourneyContext";
import { WeatherProvider } from "./context/WeatherContext";

import "./i18n";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <WeatherProvider>
        <JourneyProvider>
          <App />
        </JourneyProvider>
      </WeatherProvider>
    </BrowserRouter>
  </React.StrictMode>
);
