export interface IsoWeekInfo {
  weekNumber: number;
  year: number;
}

/**
 * Returns ISO-8601 week number/year in UTC.
 * ISO weeks start on Monday and week 1 is the week with Jan 4.
 */
export function getIsoWeekInfo(date: Date = new Date()): IsoWeekInfo {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));

  const dayOfWeek = utcDate.getUTCDay() || 7; // Sunday -> 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayOfWeek); // Thursday of ISO week

  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNumber = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return { weekNumber, year: isoYear };
}

/**
 * Returns Monday 00:00:00.000 UTC and Sunday 23:59:59.999 UTC
 * for the provided ISO week/year.
 */
export function getIsoWeekDateRange(
  weekNumber: number,
  year: number,
): { startsAt: string; endsAt: string } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Monday=1 ... Sunday=7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (weekNumber - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return {
    startsAt: monday.toISOString(),
    endsAt: sunday.toISOString(),
  };
}

/**
 * Returns the previous ISO week/year pair.
 */
export function getPreviousIsoWeek(
  weekNumber: number,
  year: number,
): IsoWeekInfo {
  if (weekNumber > 1) {
    return { weekNumber: weekNumber - 1, year };
  }

  const lastWeekOfPreviousYear = getIsoWeekInfo(new Date(Date.UTC(year - 1, 11, 28)));
  return {
    weekNumber: lastWeekOfPreviousYear.weekNumber,
    year: year - 1,
  };
}
