import type { Experience } from "../../types/experience";

// Browsing remains available when no destination can be started now.
// Callers must label fallback cards as details, never immediate missions.
export function getCategorySlides(
  catalog: Experience[], readyIds: Set<string>, matches: (item: Experience) => boolean,
): Experience[] {
  const category = catalog.filter((item) => item.isActive !== false && matches(item));
  const ready = category.filter((item) => readyIds.has(item.experienceId));
  return ready.length ? ready : category;
}
