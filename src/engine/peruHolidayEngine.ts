/**
 * Calendario nacional del piloto Perú, reglas vigentes consultadas el 15/09/2026.
 * Fuente: https://www.gob.pe/feriados
 * No incluye días no laborables compensables ni festividades regionales.
 * Revisar anualmente las reglas; no es un calendario legal histórico.
 */
const FIXED_HOLIDAYS = new Set([
  "01-01", "05-01", "06-07", "06-29", "07-23", "07-28", "07-29",
  "08-06", "08-30", "10-08", "11-01", "12-08", "12-09", "12-25",
]);

export function isPeruNationalHoliday(date: Date): boolean {
  if (!Number.isFinite(date.getTime())) return false;
  const year = date.getFullYear();
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (FIXED_HOLIDAYS.has(monthDay)) return true;

  // Computus gregoriano: Jueves y Viernes Santo preceden a Pascua por 3 y 2 días.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = Date.UTC(year, month - 1, day);
  const selected = Date.UTC(year, date.getMonth(), date.getDate());
  const daysBeforeEaster = (easter - selected) / 86_400_000;
  return daysBeforeEaster === 3 || daysBeforeEaster === 2;
}
