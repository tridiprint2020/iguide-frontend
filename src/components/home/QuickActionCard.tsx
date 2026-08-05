type Props = {
  title: string;
  subtitle: string;
  icon: string;
  image?: string;
  accent?: string;
  variant?: "photo" | "map";
  onClick: () => void;
};

function QuickActionCard({
  title,
  subtitle,
  icon,
  image,
  accent = "#FF00FF",
  variant = "photo",
  onClick,
}: Props) {
  const hasImage =
    variant === "photo" &&
    Boolean(image);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        minHeight: "138px",
        width: "100%",
        padding: 0,
        overflow: "hidden",

        border:
          "1px solid rgba(255,255,255,0.09)",

        borderRadius: "18px",

        background:
          variant === "map"
            ? `
              radial-gradient(
                circle at 75% 30%,
                rgba(255,0,255,0.30),
                transparent 32%
              ),
              linear-gradient(
                145deg,
                #28102B 0%,
                #111111 58%,
                #090909 100%
              )
            `
            : "#161616",

        cursor: "pointer",

        textAlign: "left",

        boxShadow:
          "0 12px 26px rgba(0,0,0,0.25)",

        transition:
          "transform 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform =
          "translateY(-3px)";

        event.currentTarget.style.borderColor =
          `${accent}88`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          "translateY(0)";

        event.currentTarget.style.borderColor =
          "rgba(255,255,255,0.09)";
      }}
    >
      {hasImage && (
        <img
          src={image}
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,

            width: "100%",
            height: "100%",

            objectFit: "cover",
          }}
        />
      )}

      {variant === "map" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,

              opacity: 0.22,

              backgroundImage: `
                linear-gradient(
                  rgba(255,255,255,0.16) 1px,
                  transparent 1px
                ),
                linear-gradient(
                  90deg,
                  rgba(255,255,255,0.16) 1px,
                  transparent 1px
                )
              `,

              backgroundSize: "24px 24px",
            }}
          />

          <div
            style={{
              position: "absolute",

              top: "22px",
              right: "28px",

              width: "14px",
              height: "14px",

              borderRadius: "50%",

              backgroundColor: accent,

              boxShadow:
                `0 0 0 7px ${accent}22, 0 0 22px ${accent}`,
            }}
          />
        </>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,

          background: hasImage
            ? `
              linear-gradient(
                to top,
                rgba(7,7,7,0.96) 0%,
                rgba(7,7,7,0.54) 55%,
                rgba(7,7,7,0.12) 100%
              )
            `
            : `
              linear-gradient(
                to top,
                rgba(7,7,7,0.66),
                transparent
              )
            `,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,

          height: "100%",
          minHeight: "138px",

          boxSizing: "border-box",

          padding: "15px",

          display: "flex",
          flexDirection: "column",

          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "13px",

            backgroundColor:
              "rgba(10,10,10,0.68)",

            border:
              "1px solid rgba(255,255,255,0.10)",

            backdropFilter:
              "blur(8px)",

            fontSize: "20px",
          }}
        >
          {icon}
        </div>

        <div>
          <h3
            style={{
              margin: "0 0 4px",

              color: "#FFFFFF",

              fontSize:
                "clamp(14px, 3.8vw, 17px)",

              lineHeight: 1.12,

              fontWeight: 850,

              textShadow:
                "0 2px 8px rgba(0,0,0,0.65)",
            }}
          >
            {title}
          </h3>

          <p
            style={{
              margin: 0,

              color:
                "rgba(255,255,255,0.74)",

              fontSize: "10px",

              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

export default QuickActionCard;