import { catalog } from "../data/catalog/catalog";
import type { Experience } from "../types/experience";

export function getCatalog(): Experience[] {
    return [...catalog];
}

export function getExperienceById(id: string) {
    return catalog.find(e => e.experienceId === id);
}

export function getExperienceBySlug(slug: string) {
    return catalog.find(e => e.slug === slug);
}

export function getExperiencesByType(type: Experience["type"]) {
    return catalog.filter(e => e.type === type);
}