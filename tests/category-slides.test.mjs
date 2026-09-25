import assert from 'node:assert/strict';
import test from 'node:test';
import { getCategorySlides } from '../src/components/home/categorySlides.ts';

const catalog = ['food', 'circuit', 'huariques', 'surprise'].map((type) => ({
  experienceId: type, type, isActive: true,
}));
test('all four categories remain browsable when only food is eligible now', () => {
  const ready = new Set(['food']);
  for (const item of catalog) {
    const pages = getCategorySlides(catalog, ready, (place) => place.type === item.type);
    assert.deepEqual(pages, [item]);
    assert.equal(ready.has(pages[0].experienceId), item.type === 'food');
  }
});
test('prefer ready destinations and never revive withdrawn catalog entries', () => {
  const entries = [
    { experienceId: 'ready', isActive: true },
    { experienceId: 'later', isActive: true },
    { experienceId: 'removed', isActive: false },
  ];
  assert.deepEqual(getCategorySlides(entries, new Set(['ready']), () => true), [entries[0]]);
  assert.deepEqual(getCategorySlides(entries, new Set(), () => true), entries.slice(0,2));
});
