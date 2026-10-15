export function melbToday(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }); // "YYYY-MM-DD"
}

/** The Melbourne calendar day ("YYYY-MM-DD") of a timestamp. */
export function melbDay(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
}

/** Melbourne date and time now, "YYYY-MM-DDTHH:MM" (24-hour). */
export function melbNow(): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Melbourne",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
