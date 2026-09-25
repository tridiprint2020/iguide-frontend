import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
let server, decide, authorize;
before(async () => {
  globalThis.localStorage = { getItem: () => 'es', setItem() {} };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { documentElement: { lang: 'es' } } });
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  const policy = await server.ssrLoadModule('/src/engine/missionStartPolicy.ts');
  decide = policy.getMissionStartDecision;
  authorize = policy.authorizeMissionStart;
});
after(async () => { await server?.close(); });
const noon = new Date(2026,8,25,12);
const clear = { condition: 'clear', isHighMountainSafe: true };
const indoor = { experienceId: 'cafe', type: 'cafe', title: 'Cafe', environment: 'indoor', isActive: true,
  weeklySchedule: { days: [0,1,2,3,4,5,6], opensAt: '09:00', closesAt: '18:00', closedOnHolidays: false } };
const trail = { experienceId: 'trail', type: 'expedition', title: 'Trail', isActive: true, environment: 'outdoor', terrain: 'trail' };
test('rain, missing weather, night, mountain risk and withdrawn places cannot be overridden', () => {
  for (const [place, weather, now] of [
    [trail, { ...clear, condition: 'rain' }, noon], [trail, null, noon],
    [trail, clear, new Date(2026,8,25,22)],
    [{ ...trail, terrain: 'mountain' }, { ...clear, isHighMountainSafe: false }, noon],
    [{ ...indoor, isActive: false }, clear, noon],
  ]) {
    let blocks = 0;
    assert.equal(authorize(place, weather, now, { block() { blocks++; }, confirm() { throw Error('must not offer override'); } }), false);
    assert.equal(blocks, 1);
  }
});
test('closed indoor venue requires explicit acceptance; cancellation denies start', () => {
  const night = new Date(2026,8,25,22);
  assert.equal(decide(indoor, clear, night).kind, 'confirm');
  for (const accepted of [false,true]) {
    let prompts = 0;
    assert.equal(authorize(indoor, clear, night, { block() { throw Error('not a hard block'); }, confirm() { prompts++; return accepted; } }), accepted);
    assert.equal(prompts, 1);
  }
});
test('unverified hours inform without incorrectly claiming the venue is closed', () => {
  const result = decide({ ...indoor, weeklySchedule: undefined }, clear, noon);
  assert.equal(result.kind, 'confirm');
  assert.match(result.message, /no está verificado/);
});
test('safe open indoor venue starts without confirmation even during rain', () => {
  assert.equal(decide(indoor, { ...clear, condition: 'rain' }, noon).kind, 'allow');
});
test('advance-planned mountain trip never becomes an ordinary hours override', () => {
  const place = { ...trail, terrain: 'mountain', advancePlanning: { minDays: 1, departureFrom: '05:00', departureUntil: '06:30' } };
  assert.equal(decide(place, clear, noon).kind, 'block');
});
test('overnight service stays open after midnight; exact closing asks confirmation', () => {
  const club = { ...indoor, type: 'nightclub', weeklySchedule: { ...indoor.weeklySchedule, days: [4], opensAt: '21:00', closesAt: '05:00' } };
  assert.equal(decide(club, clear, new Date(2026,8,25,0,30)).kind, 'allow');
  assert.equal(decide(club, clear, new Date(2026,8,25,5)).kind, 'confirm');
});

test('real JourneyProvider blocks before feedback, GPS and persisted state on rejection or cancellation', async () => {
  const { readFileSync } = await import('node:fs');
  const { default: vm } = await import('node:vm');
  const { default: ts } = await import('typescript');
  const code = ts.transpileModule(readFileSync(new URL('../src/context/JourneyContext.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  for (const place of [trail, { ...indoor, weeklySchedule: undefined }]) {
    const effects = [];
    const exports = {};
    vm.runInNewContext(code, {
      exports, Date,
      localStorage: { getItem: () => null, setItem() { effects.push('write'); }, removeItem() { effects.push('remove'); } },
      window: { alert() {}, confirm: () => false },
      navigator: { geolocation: {} },
      require(name) {
        if (name === 'react') return { createContext: () => ({ Provider: 'provider' }), useRef: (v) => ({ current: v }),
          useState: (v) => [typeof v === 'function' ? v() : v, () => effects.push('state')], useEffect() {} };
        if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
        if (name === './WeatherContext') return { useWeather: () => ({ weather: { ...clear, condition: 'rain' }, isLoading: false, error: null }) };
        if (name === '../engine/missionStartPolicy') return { authorizeMissionStart: authorize };
        if (name === '../i18n') return { tx: (s) => s };
        if (name === '../engine/locationTracker') return { locationTracker: { prepareFeedback() { effects.push('feedback'); } } };
        return {};
      },
    });
    const provider = exports.JourneyProvider({ children: null });
    assert.equal(provider.props.value.startWalking(place), false);
    assert.deepEqual(effects, []);
  }
});
