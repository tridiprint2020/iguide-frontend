const origins = new Set(["/", "/explorer", "/mapa", "/itinerario", "/favoritos", "/hospes"]);
export function getDetailReturnPath(state: unknown): string {
  const from = state && typeof state === "object" ? (state as { from?: unknown }).from : null;
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//") || /[\\\s]/.test(from)) return "/explorer";
  const pathname = from.split(/[?#]/)[0];
  return origins.has(pathname) ? from : "/explorer";
}
export const browseCategories = [
  ["expedition", "Circuito turístico"], ["restaurant", "Restaurantes"], ["cafe", "Cafés"],
  ["food_route", "Rutas gastronómicas"], ["museum", "Museos"], ["craft", "Artesanía"],
  ["festival", "Festividades"], ["event", "Eventos"], ["bar", "Bares"], ["nightclub", "Vida nocturna"], ["hotel", "Hoteles"],
] as const;
export function readBrowseTypes(params: URLSearchParams): string[] {
  const valid = new Set<string>(browseCategories.map(([type]) => type));
  return (params.get("types") ?? "").split(",").filter(type => valid.has(type));
}
