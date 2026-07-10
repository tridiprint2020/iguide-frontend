function PrimaryButton({ text, onClick }: { text: string, onClick?: () => void }) {
  return<button onClick={onClick}style={{
        backgroundColor: "#2563EB",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px"
      }}
      >{text}</button>;
}

export default PrimaryButton;