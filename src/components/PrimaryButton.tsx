import { Theme } from "../styles/theme";

type Props = {
  text: string;
  onClick?: () => void;
};

function PrimaryButton({ text, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        background: Theme.Colors.primary,
        color: Theme.Colors.surface,
        border: "none",
        padding: `${Theme.Space.md}px ${Theme.Space.xl}px`,
        borderRadius: Theme.Radius.medium,
        fontSize: Theme.Typography.body,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: Theme.Shadows.card,
        transition: "0.25s",
      }}
    >
      {text}
    </button>
  );
}

export default PrimaryButton;