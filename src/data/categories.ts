import type { Interest } from "../types/interest";

export interface Category {
  experienceId: Interest;
  icon: string;
  title: string;
  message: string;
}

export const categories: Category[] = [
  { experienceId: "photography", icon: "📸", title: "Fotografía", message: "Buscaré los mejores paisajes y miradores para ti." },
  { experienceId: "adventure", icon: "🥾", title: "Aventura", message: "Prepararé una expedición con mayor emoción y naturaleza." },
  { experienceId: "gastronomy", icon: "🍽", title: "Gastronomía", message: "Hoy recorreremos los mejores sabores del Valle del Mantaro." },
  { experienceId: "family", icon: "👨‍👩‍👧", title: "Familia", message: "Buscaré lugares cómodos y seguros para todos." },
  { experienceId: "couples", icon: "❤️", title: "Pareja", message: "Prepararé una experiencia especial para compartir juntos." },
  { experienceId: "backpacker", icon: "🎒", title: "Mochilero", message: "Encontraré experiencias auténticas y económicas." },
  { experienceId: "nightlife", icon: "🌃", title: "Vida Nocturna", message: "Buscaré los mejores lugares para disfrutar la noche." },
];