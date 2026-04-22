export const queryKeys = {
  config: ["app-config"] as const,
  activities: (username: string) => ["activities", username] as const,
  entries: (username: string, year: number, month: number) =>
    ["entries", username, year, month] as const,
  monthlySummary: (year: number, month: number) => ["monthly-summary", year, month] as const,
};
