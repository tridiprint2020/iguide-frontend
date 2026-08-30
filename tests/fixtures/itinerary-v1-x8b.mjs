const recommendation = (visitMinutes) => ({
  action: "recommended",
  reasonCode: "interest-match",
  params: {
    priority: "gastronomy",
    visitMinutes,
    precipitationProbability: 6,
    windSpeedKmh: 8,
  },
});

export const FIXTURE_V1_X8B = {
  schemaVersion: 1,
  selectedDate: "2026-08-31",
  selectedHour: 9,
  availableMinutes: 720,
  totalDurationMinutes: 666,
  preferences: {
    priority: "gastronomy",
    transport: "taxi",
  },
  forecast: {
    date: "2026-08-31",
    city: "Huancayo",
    condition: "cloudy",
    temperatureMin: 6,
    temperatureMax: 24,
    precipitationProbability: 6,
    windSpeedKmh: 8,
    isHighMountainSafe: true,
    periods: {
      morning: {
        hour: 9,
        temperature: 14,
        condition: "cloudy",
      },
      afternoon: {
        hour: 15,
        temperature: 24,
        condition: "cloudy",
      },
      night: {
        hour: 21,
        temperature: 12,
        condition: "sunny",
      },
    },
  },
  stops: [
    ["EXP-0003", 548, 668, 8, 120],
    ["EXP-0004", 678, 798, 10, 120],
    ["RES-0001", 806, 866, 8, 60],
    ["RES-0002", 874, 934, 8, 60],
    ["RES-0003", 942, 1002, 8, 60],
    ["RES-0004", 1010, 1070, 8, 60],
    ["RES-0005", 1078, 1138, 8, 60],
    ["RES-0006", 1146, 1206, 8, 60],
  ].map(
    ([experienceId, startMinutes, endMinutes, travelMinutes, visitMinutes]) => ({
      experienceId,
      startMinutes,
      endMinutes,
      travelMinutes,
      visitMinutes,
      explanation: recommendation(visitMinutes),
    })
  ),
  exclusions: [],
};
