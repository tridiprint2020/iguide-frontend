function HospesCard() {
  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "18px",
        maxWidth: "340px",
        margin: "0 auto 30px auto",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ margin: 0 }}>Hospes</h3>

      <p>Buenos días, explorador.</p>

      <p style={{ marginTop: "8px", color: "#666" }}>
        Tu asistente inteligente de viaje.
      </p>
    </div>
  );
}

export default HospesCard;