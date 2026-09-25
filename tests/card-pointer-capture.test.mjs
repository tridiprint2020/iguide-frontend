import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { getCardSwipeStep } from '../src/components/home/cardSwipe.ts';

// Run the real component handlers without a browser. Simulate the bubbling
// event Chrome sends when touch capture transfers from its button to the card.
function handlers(direction) {
  const updates = [];
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/components/home/QuickActionsGrid.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react') return { useRef: (value) => ({ current: value }), useEffect: () => {},
      useState: (value) => [value, (next) => updates.push(next)] };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === '../../i18n') return { tx: (s) => s };
    if (name === './cardSwipe') return { getCardSwipeStep };
    return {};
  } });
  const root = exports.default({ actions: [{ id: 'cover', title: 'Category', direction, tone: 'cyan', slides: [
    { id: 'place', title: 'Place', onClick() {} },
  ] }] });
  const child = root.props.children[0];
  return { props: child.type(child.props).props, updates };
}

test('touch capture transferred from a child preserves swipes in all four directions', () => {
  for (const [direction, dx, dy] of [['up',0,-70], ['right',70,0], ['left',-70,0], ['down',0,70]]) {
    const { props, updates } = handlers(direction);
    const child = { closest: () => null };
    let captured = false;
    const card = { hasPointerCapture: () => captured, setPointerCapture() {
      captured = true;
      props.onLostPointerCapture({ target: child, currentTarget: card });
    } };
    const event = { isPrimary: true, button: 0, pointerId: 1, target: child, currentTarget: card, clientX: 100, clientY: 100 };
    props.onPointerDown(event);
    props.onPointerMove({ ...event, clientX: 100 + dx, clientY: 100 + dy });
    assert.equal(updates.includes('place'), false, 'wait for finger release');
    props.onPointerUp({ ...event, clientX: 100 + dx, clientY: 100 + dy });
    assert.equal(updates.includes('place'), true, direction);
    let suppressed = false;
    props.onClickCapture({ preventDefault() { suppressed = true; }, stopPropagation() {} });
    assert.equal(suppressed, true, 'swipe must not activate a mission');
  }
});

test('loss of capture from the card itself cancels the gesture', () => {
  const { props, updates } = handlers('up');
  const card = {};
  props.onPointerDown({ isPrimary: true, button: 0, clientX: 100, clientY: 100, target: { closest: () => null } });
  props.onLostPointerCapture({ target: card, currentTarget: card });
  props.onPointerUp({ clientX: 100, clientY: 20 });
  assert.equal(updates.includes('place'), false);
});
