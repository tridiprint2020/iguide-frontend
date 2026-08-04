import WeatherCard from "./WeatherCard";

import { loadUserProfile } from "../data/user";
import { Theme } from "../styles/theme";

import type { WeatherStatus } from "../engine/weatherEngine";

type Props = {
  weather: WeatherStatus;
  isWeatherLoading?: boolean;
};

function Hero({
  weather,
  isWeatherLoading = false,
}: Props) {
  const profile =
    loadUserProfile();

  const displayName =
    profile.name?.trim() ||
    "Explorador";

  return (
    <section
      style={{
        display: "grid",

        gridTemplateColumns:
          "minmax(0, 1fr) auto",

        gap: "10px",

        alignItems:
          "flex-start",

        width: "100%",
        minWidth: 0,

        paddingTop: "60px",

        boxSizing:
          "border-box",
          paddingLeft: "52px",
      }}
    >
      <div
        style={{
          minWidth: 0,

          display: "flex",

          flexDirection:
            "column",

          gap: "10px",
        }}
      >
        <div>
          <p
            style={{
              margin:
                "0 0 5px",

              fontSize: "13px",

              color:
                Theme.Colors
                  .textSoft,

              textAlign:
                "left",
            }}
          >
            ¡Hola, {displayName}! 👋
          </p>

          <h1
            style={{
              margin:
                "0 0 10px",

              lineHeight: 1.05,

              fontFamily:
                Theme.Typography
                  .title,

              fontWeight: 300,

              fontSize:
                "clamp(1.65rem, 5vw, 2.6rem)",

              textAlign:
                "left",

              color:
                Theme.Colors.text,
            }}
          >
            Bienvenido a
            <br />

            <span
              style={{
                color:
                  Theme.Colors
                    .primary,

                fontWeight: 800,
              }}
            >
              {weather.city}
            </span>
          </h1>

          <p
            style={{
              margin: 0,

              lineHeight: 1.35,

              color:
                Theme.Colors
                  .textSoft,

              whiteSpace:
                "pre-line",

              textAlign:
                "left",

              fontSize: "12px",
            }}
          >
            {
              "No visites.\nPertenece.\nVive la ciudad como un local."
            }
          </p>
        </div>
      </div>

      {isWeatherLoading ? (
        <div
          style={{
            minWidth: "82px",

            color:
              Theme.Colors
                .textSoft,

            fontSize: "10px",

            textAlign:
              "right",
          }}
        >
          Consultando
          <br />
          clima…
        </div>
      ) : (
        <WeatherCard
          temperature={
            weather.temperature
          }
          weather={{
            condition:
              weather.condition,
          }}
        />
      )}
    </section>
  );
}

export default Hero;