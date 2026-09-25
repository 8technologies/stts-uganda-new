// Seed production seasons: each year has two, A (Jan-Jun) and B (Jul-Dec).
// Mirrors the A/B boundary used by getSeasonAndExpiry in packages/server/server.js.
//
// Date handling here deliberately avoids Date#toISOString()/UTC round-trips:
// for a positive UTC-offset timezone (Uganda is UTC+3), converting a local
// midnight Date to UTC can roll it back to the previous calendar day, which
// would silently shift a season's start date (and its label) by a day.
// Instead we work with plain Y/M/D integers and only ever use a real Date
// object to read "today" from the browser's local clock.

export type SeasonHalf = 'A' | 'B';

export type SeasonOption = {
  label: string; // e.g. "2027A"
  value: string; // YYYY-MM-DD (season start)
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const seasonHalfFromMonth = (month: number): SeasonHalf =>
  month < 6 ? 'A' : 'B';

// Extracts the calendar Y/M/D from an ISO date or datetime string,
// ignoring any time/timezone suffix.
const parseIsoDateParts = (
  isoDate: string
): { year: number; month: number; day: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
};

const formatDateParts = (year: number, month: number, day: number) =>
  `${year}-${pad2(month + 1)}-${pad2(day)}`;

export const getSeasonLabel = (date: Date): string =>
  `${date.getFullYear()}${seasonHalfFromMonth(date.getMonth())}`;

const nextSeason = (year: number, half: SeasonHalf) =>
  half === 'A'
    ? { year, half: 'B' as SeasonHalf }
    : { year: year + 1, half: 'A' as SeasonHalf };

/*
 * Pre-orders must be placed at least a full season cycle in advance --
 * seed actors can only order for next calendar year onward, never for
 * the season they're currently in or the rest of the current year.
 */
export const getEarliestOrderableSeason = (from: Date = new Date()) => ({
  year: from.getFullYear() + 1,
  half: 'A' as SeasonHalf,
});

export const getUpcomingSeasonOptions = (
  count = 2,
  from: Date = new Date()
): SeasonOption[] => {
  let { year, half } = getEarliestOrderableSeason(from);
  const options: SeasonOption[] = [];

  for (let i = 0; i < count; i++) {
    options.push({
      label: `${year}${half}`,
      value: formatDateParts(year, half === 'A' ? 0 : 6, 1),
    });
    ({ year, half } = nextSeason(year, half));
  }

  return options;
};

export const getSeasonLabelFromDateString = (
  isoDate?: string | null
): string => {
  if (!isoDate) return '-';
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return '-';
  return `${parts.year}${seasonHalfFromMonth(parts.month)}`;
};
