export function melbToday(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }); // "YYYY-MM-DD"
}

/** The Melbourne calendar day ("YYYY-MM-DD") of a timestamp. */
export function melbDay(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
}
