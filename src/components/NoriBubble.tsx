import "./NoriBubble.css";

type Props = {
  message: string;
};

function NoriBubble({ message }: Props) {
  return (
    <aside className="nori-bubble">
      <span aria-hidden="true">✦</span>
      <p>{message}</p>
    </aside>
  );
}

export default NoriBubble;