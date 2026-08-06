import logoIG from "../assets/optimized/logoIG.webp";

function BrandMark() {
  return (
    <div
      style={{
        position: "absolute",
        top: "2px",
        left: "1px",
        zIndex: 1100,
        pointerEvents: "none",
      }}
    >
      <img
        src={logoIG}
        alt="I.GUIDE — Feel the City"
        style={{
          display: "block",

          width: "120px",
          maxWidth: "25vw",
          height: "auto",

          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default BrandMark;