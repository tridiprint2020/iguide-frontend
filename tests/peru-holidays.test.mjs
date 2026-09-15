import assert from "node:assert/strict";
import test from "node:test";
import { isPeruNationalHoliday } from "../src/engine/peruHolidayEngine.ts";

test("calendario 2026: dieciséis feriados nacionales, sin días compensables", () => {
  const actual = [];
  for (const date = new Date(2026, 0, 1, 12); date.getFullYear() === 2026; date.setDate(date.getDate() + 1)) {
    if (isPeruNationalHoliday(date)) actual.push(`${date.getMonth() + 1}-${date.getDate()}`);
  }
  assert.deepEqual(actual, ["1-1", "4-2", "4-3", "5-1", "6-7", "6-29", "7-23",
    "7-28", "7-29", "8-6", "8-30", "10-8", "11-1", "12-8", "12-9", "12-25"]);
  assert.equal(isPeruNationalHoliday(new Date(NaN)), false);
});
