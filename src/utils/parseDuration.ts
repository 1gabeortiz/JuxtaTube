// YouTube reports duration as an ISO 8601 string: "PT4M13S", "PT1H2M3S", "P1DT2H".
const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

export function durationToSeconds(iso: string): number {
  const match = ISO_DURATION.exec(iso);
  if (!match) return 0;

  const [, days, hours, minutes, seconds] = match;
  return (
    Number(days ?? 0) * 86_400 +
    Number(hours ?? 0) * 3_600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  );
}

/** "PT4M13S" -> "4:13", "PT1H2M3S" -> "1:02:03". */
export function parseDuration(iso: string): string {
  const total = durationToSeconds(iso);
  if (total <= 0) return '0:00';

  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;

  const paddedSeconds = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}
