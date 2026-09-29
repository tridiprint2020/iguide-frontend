import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDetailReturnPath, readBrowseTypes } from '../src/engine/navigationPolicy.ts';
test('detail preserves allowed origin, query and map filters', () => {
 for (const from of ['/explorer?types=cafe&q=Par%C3%ADs','/mapa?types=museum&favorites=1','/mapa?nearby=all&radius=3']) assert.equal(getDetailReturnPath({from}),from);
});
test('direct links and unsafe origins fall back inside the catalog', () => {
 for (const from of [undefined,'https://example.com','//example.com','/\\example.com','/journey','/expedition/test','/mapa bad']) assert.equal(getDetailReturnPath({from}),'/explorer');
 assert.equal(getDetailReturnPath(null),'/explorer');
});
test('catalog map transfer accepts only known categories', () => {
 assert.deepEqual(readBrowseTypes(new URLSearchParams('types=cafe,invalid,museum')),['cafe','museum']);
 assert.deepEqual(readBrowseTypes(new URLSearchParams()),[]);
});
