export interface Mood {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  tag: string; // tag del catálogo que representa este mood
}

export const moods: Mood[] = [
  { id: "relax", icon: "☕", title: "Relajarme", subtitle: "Cafés, parques y rincones tranquilos", tag: "tranquilo" },
  { id: "food", icon: "🍽", title: "Comer increíble", subtitle: "Sabores locales que no olvidarás", tag: "tradicional" },
  { id: "culture", icon: "🏛", title: "Conocer la cultura", subtitle: "Historia, museos y tradiciones", tag: "cultura" },
  { id: "hidden", icon: "📸", title: "Descubrir rincones", subtitle: "Lugares secretos que te encantarán", tag: "mirador" },
  { id: "surprise", icon: "❤️", title: "Sorprender a alguien", subtitle: "Planes perfectos para momentos especiales", tag: "pareja" },
];

