import assert from 'node:assert/strict';
import test from 'node:test';
import { getCardSwipeStep } from '../src/components/home/cardSwipe.ts';
test('los cuatro gestos avanzan y el gesto inverso retrocede una tarjeta', () => {
  for (const [direction, dx, dy] of [['up',0,-60],['right',60,0],['left',-60,0],['down',0,60]]) {
    assert.equal(getCardSwipeStep(direction,dx,dy),1);
    assert.equal(getCardSwipeStep(direction,-dx,-dy),-1);
  }
});
test('un toque, movimiento corto o diagonal no cambia la tarjeta', () => {
  for (const direction of ['up','right','left','down']) {
    for (const [dx,dy] of [[0,0],[15,0],[0,-20],[60,60]]) assert.equal(getCardSwipeStep(direction,dx,dy),0);
  }
});
