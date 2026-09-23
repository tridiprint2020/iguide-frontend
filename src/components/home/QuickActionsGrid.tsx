import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { tx } from "../../i18n";
import "./QuickActionsGrid.css";

type Direction = "up" | "right" | "down" | "left";
type Slide = { id: string; title: string; subtitle: string; image?: string; onClick: () => void };
type QuickAction = Slide & { tone: "magenta" | "cyan"; direction: Direction; slides: Slide[] };
const arrows = { up: ArrowUp, right: ArrowRight, down: ArrowDown, left: ArrowLeft };
const vectors = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

export default function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return <section className="home-actions" aria-label={tx("Acciones rápidas")}>
    {actions.map((action) => <ActionCard key={action.id} action={action} />)}
  </section>;
}

function ActionCard({ action }: { action: QuickAction }) {
  const [selectedId, setSelectedId] = useState(action.id);
  const [reverse, setReverse] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const pages = [action, ...action.slides];
  const index = Math.max(0, pages.findIndex((page) => page.id === selectedId));
  const page = pages[index];
  const Arrow = arrows[action.direction];
  const [x, y] = vectors[action.direction];
  function advance(back = false) {
    if (pages.length < 2) return;
    setReverse(back);
    setSelectedId(pages[(index + (back ? -1 : 1) + pages.length) % pages.length].id);
  }
  const style = {
    "--accent": action.tone === "cyan" ? "#00e6ff" : "#ff3de8",
    "--enter-x": `${x * (reverse ? 100 : -100)}%`,
    "--enter-y": `${y * (reverse ? 100 : -100)}%`,
  } as CSSProperties;
  return <article className="home-action" style={style} aria-label={action.title}
    onKeyDown={(event) => {
      const offsets: Record<string, number[]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      const offset = offsets[event.key];
      if (!offset || !(offset[0] * x + offset[1] * y)) return;
      event.preventDefault(); advance(offset[0] * x + offset[1] * y < 0);
    }}
    onPointerDown={(event) => {
      swiped.current = false;
      if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('.home-action__toggle')) return;
      start.current = { x: event.clientX, y: event.clientY };
    }}
    onPointerMove={(event) => {
      if (!start.current) return;
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      const along = dx * x + dy * y;
      const across = x ? Math.abs(dy) : Math.abs(dx);
      if (Math.abs(along) < 36 || Math.abs(along) < across * 1.4) return;
      swiped.current = true; start.current = null; advance(along < 0);
    }}
    onPointerUp={() => { start.current = null; }}
    onPointerCancel={() => { start.current = null; }}
    onPointerLeave={() => { start.current = null; }}
    onClickCapture={(event) => {
      if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; }
    }}>
    <CardFace key={page.id} page={page} isDestination={index > 0} />
    {pages.length > 1 && <button type="button" className={`home-action__toggle home-action__toggle--${action.direction}`}
      aria-label={`${action.title}: ${tx("Siguiente opción")}`} onClick={() => advance()}>
      <Arrow size={18} strokeWidth={1.4} aria-hidden="true" />
    </button>}
    <span className="home-action__announcement" aria-live="polite" aria-atomic="true">{page.title} · {index + 1}/{pages.length}</span>
  </article>;
}
function CardFace({ page, isDestination }: { page: Slide; isDestination: boolean }) {
  const [failed, setFailed] = useState(false);
  return <button type="button" className="home-action__face" onClick={page.onClick}
    aria-label={isDestination ? `${tx("Iniciar misión")}: ${page.title}` : page.title}>
    {page.image && !failed && <img className="home-action__image" src={page.image} alt="" onError={() => setFailed(true)} />}
    <span className="home-action__shade" />
    <span className="home-action__content">
      <span className="home-action__title">{page.title}</span>
      <span className="home-action__description">{page.subtitle}</span>
      {isDestination && <span className="home-action__mission">{tx("Iniciar misión")} →</span>}
      {isDestination && (!page.image || failed) && <span className="home-action__photo-note">{tx("Foto del lugar pendiente")}</span>}
    </span>
  </button>;
}
