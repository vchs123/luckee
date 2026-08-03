export function melbToday(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }); // "YYYY-MM-DD"
}
