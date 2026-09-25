import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
let server, within;
before(async () => { server = await createServer({ server: { middlewareMode: true }, appType: 'custom' }); within = (await server.ssrLoadModule('/src/engine/nearbyEngine.ts')).withinNearbyRadius; });
after(async () => { await server?.close(); });
const origin = { latitude: -12.07, longitude: -75.21 };
const places = [
 { experienceId: 'far', latitude: -12.10, longitude: -75.21 },
 { experienceId: 'close', latitude: -12.071, longitude: -75.21 },
 { experienceId: 'medium', latitude: -12.085, longitude: -75.21 },
 { experienceId: 'invalid', latitude: NaN, longitude: -75.21 },
];
test('nearby limits radius, orders actual distance and excludes invalid coordinates', () => {
 assert.deepEqual(within(places, origin, 1).map(p => p.experience.experienceId), ['close']);
 assert.deepEqual(within(places, origin, 3).map(p => p.experience.experienceId), ['close','medium']);
 assert.deepEqual(within(places, origin, 5).map(p => p.experience.experienceId), ['close','medium','far']);
});
test('changing the origin recomputes proximity instead of keeping a city-center order', () => {
 assert.equal(within(places, places[0], 1)[0].experience.experienceId, 'far');
 assert.equal(within(places, places[0], 1)[0].distance, 0);
});
