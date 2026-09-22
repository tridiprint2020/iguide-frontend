import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tx } from "../../i18n";
import "./QuickActionsGrid.css";

type Direction = "up" | "right" | "down" | "left";
type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "magenta" | "cyan";
  image?: string;
  direction: Direction;
  options: { label: string; onClick: () => void }[];
  onClick: () => void;
};
const arrows = { up: ArrowUp, right: ArrowRight, down: ArrowDown, left: ArrowLeft };
const vectors = { up: [0, -100], right: [100, 0], down: [0, 100], left: [-100, 0] };

export default function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return <section className="home-actions" aria-label={tx("Acciones rápidas")}>
    {actions.map((action) => <ActionCard key={action.id} action={action} />)}
  </section>;
}

function ActionCard({ action }: { action: QuickAction }) {
  const [expanded, setExpanded] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const Arrow = arrows[action.direction];
  const [x, y] = vectors[action.direction];
  const style = {
    "--accent": action.tone === "cyan" ? "#00e6ff" : "#ff3de8",
    "--slide-x": `${x}%`, "--slide-y": `${y}%`,
    "--enter-x": `${-x}%`, "--enter-y": `${-y}%`,
  } as CSSProperties;
  return <article className="home-action" style={style}>
    {action.image && <img className="home-action__image" src={action.image} alt="" />}
    <div className="home-action__shade" />
    <header className="home-action__header">
      <h2><button className="home-action__title" onClick={action.onClick}>{action.title}</button></h2>
    </header>
    <div className="home-action__viewport"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        start.current = { x: event.clientX, y: event.clientY };
        swiped.current = false;
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        const along = x ? dx * Math.sign(x) : dy * Math.sign(y);
        const across = x ? Math.abs(dy) : Math.abs(dx);
        if (Math.abs(along) < 36 || Math.abs(along) < across * 1.4) return;
        swiped.current = true;
        start.current = null;
        setExpanded(along > 0);
      }}
      onPointerUp={() => { start.current = null; }}
      onPointerCancel={() => { start.current = null; }}
      onPointerLeave={() => { start.current = null; }}
      onClickCapture={(event) => {
        if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; }
      }}>
      <button type="button" className="home-action__panel home-action__primary" onClick={action.onClick} inert={expanded} aria-hidden={expanded}
        style={{ transform: expanded ? `translate(${x}%, ${y}%)` : "translate(0, 0)" }}>
        <p>{action.subtitle}</p>
      </button>
      <div id={`options-${action.id}`} className="home-action__panel home-action__panel--options"
        inert={!expanded} aria-hidden={!expanded}
        style={{ transform: expanded ? "translate(0, 0)" : `translate(${-x}%, ${-y}%)` }}>
        {action.options.map((option) => <button key={option.label} className="home-action__link" onClick={option.onClick}>{option.label}</button>)}
      </div>
    </div>
    <button type="button" className={`home-action__toggle home-action__toggle--${action.direction}`} aria-expanded={expanded} aria-controls={`options-${action.id}`}
      aria-label={`${action.title}: ${expanded ? tx("Volver") : tx("Más opciones")}`}
      onClick={() => setExpanded((value) => !value)}>
      <Arrow size={18} strokeWidth={1.4} aria-hidden="true" style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
    </button>
  </article>;
}
