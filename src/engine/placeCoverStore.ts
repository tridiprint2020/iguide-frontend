import { publicCoverUrl, type PublishedPlaceCover } from "./placeCoverContract";

export type VisiblePlaceCover = PublishedPlaceCover & { url: string };
let covers: ReadonlyMap<string, VisiblePlaceCover> = new Map();
const listeners = new Set<() => void>();

export const getPlaceCoverSnapshot = () => covers;
export function subscribeToPlaceCovers(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function notify(next: Map<string, VisiblePlaceCover>) {
  covers = next;
  listeners.forEach(listener => listener());
}
export function replacePlaceCovers(projectUrl: string, rows: PublishedPlaceCover[]) {
  notify(new Map(rows.map(row => [row.experience_id, { ...row, url: publicCoverUrl(projectUrl, row.object_path) }])));
}
export function setPlaceCover(projectUrl: string, row: PublishedPlaceCover) {
  const next = new Map(covers);
  next.set(row.experience_id, { ...row, url: publicCoverUrl(projectUrl, row.object_path) });
  notify(next);
}
export function forgetPlaceCover(id: string, expectedPath?: string) {
  if (expectedPath && covers.get(id)?.object_path !== expectedPath) return;
  const next = new Map(covers);
  next.delete(id);
  notify(next);
}
