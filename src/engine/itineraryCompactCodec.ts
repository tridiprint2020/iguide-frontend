/**
 * Portable wire format c1. Positions are immutable: changes require a new version.
 * Only field names are removed; dates, timing, decisions and weather are retained.
 * Decoded values must still pass parseItinerarySnapshot before use.
 */
const period = ["hour", "temperature", "apparentTemperature", "condition", "precipitationProbability", "windSpeedKmh"] as const;
const forecast = ["date", "city", "condition", "temperatureMin", "temperatureMax", "precipitationProbability", "windSpeedKmh", "isHighMountainSafe", "apparentTemperature", "uvIndexMax", "sunrise", "sunset", "daylightDurationSeconds", "precipitationHours", "periods"] as const;
const decision = ["action", "reasonCode", "params"] as const;
const stop = ["experienceId", "startMinutes", "endMinutes", "travelMinutes", "visitMinutes", "explanation"] as const;
const snapshot = ["selectedDate", "selectedHour", "endMinutes", "totalDurationMinutes", "preferences", "forecast", "selectedForecastPeriod", "stops"] as const;

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid compact object");
  return value as RecordValue;
}
function pack(value: unknown, keys: readonly string[]): unknown[] {
  const source = record(value);
  return keys.map((key) => source[key] ?? null);
}
function unpack(value: unknown, keys: readonly string[]): RecordValue {
  if (!Array.isArray(value) || value.length !== keys.length) throw new Error("Invalid compact tuple");
  return Object.fromEntries(keys.flatMap((key, index) => value[index] === null ? [] : [[key, value[index]]]));
}
function packForecast(value: unknown): unknown {
  if (value === null) return null;
  const source = record(value);
  return pack({ ...source, periods: source.periods
    ? ["morning", "afternoon", "night"].map((key) => pack(record(source.periods)[key], period))
    : null }, forecast);
}
function unpackForecast(value: unknown): unknown {
  if (value === null) return null;
  const result = unpack(value, forecast);
  if (result.periods) {
    const periods = unpack(result.periods, ["morning", "afternoon", "night"]);
    result.periods = Object.fromEntries(Object.entries(periods).map(([key, value]) => [key, unpack(value, period)]));
  }
  return result;
}

export function packItinerary(value: unknown): unknown[] {
  const source = record(value);
  if (!Array.isArray(source.stops)) throw new Error("Invalid stops");
  const decisions: unknown[][] = [];
  const indices = new Map<string, number>();
  const payload = pack({ ...source,
    preferences: pack(source.preferences, ["priorities", "transport"]),
    forecast: packForecast(source.forecast),
    selectedForecastPeriod: source.selectedForecastPeriod ? pack(source.selectedForecastPeriod, period) : null,
    stops: source.stops.map((value) => {
      const item = record(value);
      const packed = pack(item.explanation, decision);
      const key = JSON.stringify(packed);
      let index = indices.get(key);
      if (index === undefined) {
        index = decisions.length;
        indices.set(key, index);
        decisions.push(packed);
      }
      return pack({ ...item, explanation: index }, stop);
    }),
  }, snapshot);
  return [payload, decisions];
}

export function unpackItinerary(value: unknown): unknown {
  if (!Array.isArray(value) || value.length !== 2 || !Array.isArray(value[1]) || value[1].length > 8) throw new Error("Invalid compact envelope");
  const decisions = value[1].map((entry) => unpack(entry, decision));
  const result = unpack(value[0], snapshot);
  if (!Array.isArray(result.stops) || result.stops.length > 8) throw new Error("Invalid stops");
  return { ...result,
    schemaVersion: 2,
    availableMinutes: Number(result.endMinutes) - Number(result.selectedHour) * 60,
    preferences: unpack(result.preferences, ["priorities", "transport"]),
    forecast: unpackForecast(result.forecast ?? null),
    selectedForecastPeriod: result.selectedForecastPeriod ? unpack(result.selectedForecastPeriod, period) : null,
    stops: result.stops.map((value) => {
      const item = unpack(value, stop);
      const index = item.explanation;
      if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= decisions.length) throw new Error("Invalid decision index");
      return { ...item, explanation: decisions[index] };
    }),
    exclusions: [],
  };
}
