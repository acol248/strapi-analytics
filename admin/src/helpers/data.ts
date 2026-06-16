export type TimeScale = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export interface TimeSeriesPoint {
  x: number | string;
  y: number | string;
  [key: string]: any;
}

/**
 * Generate random uuid.
 * Use crypto.randomUUID() if available, otherwise fallback to custom solution.
 * @returns string id
 */
export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const randomPart = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${randomPart()}${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}${randomPart()}${randomPart()}`;
};

/**
 * Pads a time-series array with zero-valued data points for missing intervals within a strict window.
 * @param data - The array of existing data points.
 * @param scale - The time unit interval ('minute', 'hour', 'day', 'week', 'month', or 'year').
 * @param quantity - The total number of intervals to return in the sequence.
 * @param anchorTimestamp - Optional. Fixes the end of the time window. Counts backward from here.
 * @returns A continuous, strictly bounded array of data points padded with 0.
 */
export const padTimeSeries = <T extends TimeSeriesPoint>(
  data: T[],
  scale: TimeScale,
  quantity: number,
  anchorTimestamp?: string | Date
): TimeSeriesPoint[] => {
  if (quantity <= 0) return [];

  let maxTime: number;
  if (anchorTimestamp) {
    maxTime = new Date(anchorTimestamp).getTime();
  } else {
    maxTime = data.length > 0 ? Math.max(...data.map((d) => new Date(d.x).getTime())) : Date.now();
  }

  const endDate = new Date(maxTime);
  if (scale === 'day') endDate.setUTCHours(0, 0, 0, 0);
  else if (scale === 'hour') endDate.setUTCMinutes(0, 0, 0);
  else if (scale === 'minute') endDate.setUTCSeconds(0, 0);
  else if (scale === 'week') {
    endDate.setUTCDate(endDate.getUTCDate() - endDate.getUTCDay());
    endDate.setUTCHours(0, 0, 0, 0);
  } else if (scale === 'month') {
    endDate.setUTCDate(1);
    endDate.setUTCHours(0, 0, 0, 0);
  } else if (scale === 'year') {
    endDate.setUTCMonth(0, 1);
    endDate.setUTCHours(0, 0, 0, 0);
  }

  const startDate = new Date(endDate);

  let hourStep = 1;
  if (scale === 'hour') hourStep = 1;

  if (scale === 'day') startDate.setUTCDate(startDate.getUTCDate() - (quantity - 1));
  else if (scale === 'hour') startDate.setUTCHours(startDate.getUTCHours() - (quantity - 1) * hourStep);
  else if (scale === 'minute') startDate.setUTCMinutes(startDate.getUTCMinutes() - (quantity - 1));
  else if (scale === 'week') startDate.setUTCDate(startDate.getUTCDate() - (quantity - 1) * 7);
  else if (scale === 'month') startDate.setUTCMonth(startDate.getUTCMonth() - (quantity - 1));
  else if (scale === 'year') startDate.setUTCFullYear(startDate.getUTCFullYear() - (quantity - 1));

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const dataLookup = new Map<string, number>();

  for (const item of data) {
    const itemDate = new Date(item.x);
    if (scale === 'day') itemDate.setUTCHours(0, 0, 0, 0);
    else if (scale === 'hour') itemDate.setUTCMinutes(0, 0, 0);
    else if (scale === 'minute') itemDate.setUTCSeconds(0, 0);
    else if (scale === 'week') {
      itemDate.setUTCDate(itemDate.getUTCDate() - itemDate.getUTCDay());
      itemDate.setUTCHours(0, 0, 0, 0);
    } else if (scale === 'month') {
      itemDate.setUTCDate(1);
      itemDate.setUTCHours(0, 0, 0, 0);
    } else if (scale === 'year') {
      itemDate.setUTCMonth(0, 1);
      itemDate.setUTCHours(0, 0, 0, 0);
    }

    const itemMs = itemDate.getTime();

    if (itemMs >= startMs && itemMs <= endMs) {
      const bucketKey = itemDate.toISOString();
      const currentVal = dataLookup.get(bucketKey) || 0;
      dataLookup.set(bucketKey, currentVal + (typeof item.y === 'number' ? item.y : 0));
    }
  }

  const paddedResult: TimeSeriesPoint[] = [];
  const currentCursor = new Date(startDate);

  let step = 1;
  if (scale === 'hour') {
    const spanMinutes = (endMs - startMs) / 6e4;
    if (spanMinutes >= 24 * 60 && spanMinutes < 48 * 60) step = 2;
  }

  for (let i = 0; i < quantity; i++) {
    const currentKey = currentCursor.toISOString();
    const existingValue = dataLookup.get(currentKey);

    paddedResult.push({
      x: currentKey,
      y: existingValue !== undefined ? existingValue : 0,
    });

    if (scale === 'day') currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
    else if (scale === 'hour') currentCursor.setUTCHours(currentCursor.getUTCHours() + step);
    else if (scale === 'minute') currentCursor.setUTCMinutes(currentCursor.getUTCMinutes() + 1);
    else if (scale === 'week') currentCursor.setUTCDate(currentCursor.getUTCDate() + 7);
    else if (scale === 'month') currentCursor.setUTCMonth(currentCursor.getUTCMonth() + 1);
    else if (scale === 'year') currentCursor.setUTCFullYear(currentCursor.getUTCFullYear() + 1);
  }

  return paddedResult;
};

/**
 * Compute the number of intervals between two dates (inclusive) for a given scale.
 * @param scale - The time unit interval ('minute', 'hour', 'day', 'week', 'month', or 'year').
 * @param start - The start date.
 * @param end - The end date.
 * @returns The number of intervals between the two dates (inclusive).
 */
export const startTime = (scale: TimeScale, start: Date, end: Date): number => {
  const diff = end.getTime() - start.getTime();

  if (scale === 'day') return Math.floor(diff / 864e5) + 1;

  if (scale === 'hour') {
    const diffMinutes = diff / 6e4;
    if (diffMinutes >= 24 * 60 && diffMinutes < 48 * 60) return Math.floor(diff / (2 * 36e5)) + 1;

    return Math.floor(diff / 36e5) + 1;
  }

  if (scale === 'minute') return Math.floor(diff / 6e4) + 1;

  if (scale === 'week') {
    const startNormalized = new Date(start);
    startNormalized.setUTCDate(startNormalized.getUTCDate() - startNormalized.getUTCDay());
    startNormalized.setUTCHours(0, 0, 0, 0);

    const endNormalized = new Date(end);
    endNormalized.setUTCDate(endNormalized.getUTCDate() - endNormalized.getUTCDay());
    endNormalized.setUTCHours(0, 0, 0, 0);

    const diffNormalized = endNormalized.getTime() - startNormalized.getTime();
    return Math.floor(diffNormalized / 6048e5) + 1;
  }

  if (scale === 'month') {
    const startNormalized = new Date(start);
    startNormalized.setUTCDate(1);
    startNormalized.setUTCHours(0, 0, 0, 0);

    const endNormalized = new Date(end);
    endNormalized.setUTCDate(1);
    endNormalized.setUTCHours(0, 0, 0, 0);

    const yearDiff = endNormalized.getUTCFullYear() - startNormalized.getUTCFullYear();
    const monthDiff = endNormalized.getUTCMonth() - startNormalized.getUTCMonth();
    return yearDiff * 12 + monthDiff + 1;
  }

  if (scale === 'year') {
    const startNormalized = new Date(start);
    startNormalized.setUTCMonth(0, 1);
    startNormalized.setUTCHours(0, 0, 0, 0);

    const endNormalized = new Date(end);
    endNormalized.setUTCMonth(0, 1);
    endNormalized.setUTCHours(0, 0, 0, 0);

    return endNormalized.getUTCFullYear() - startNormalized.getUTCFullYear() + 1;
  }

  return 1;
};

/**
 * Normalize an end `Date` to the provided scale (used as anchor timestamp).
 * @param scale - The time unit interval ('minute', 'hour', 'day', 'week', 'month', or 'year').
 * @param end - The end date.
 * @returns A new `Date` object normalized to the specified scale.
 */
export const endTime = (scale: TimeScale, end: Date): Date => {
  const d = new Date(end);

  if (scale === 'day') d.setUTCHours(0, 0, 0, 0);
  else if (scale === 'hour') d.setUTCMinutes(0, 0, 0);
  else if (scale === 'minute') d.setUTCSeconds(0, 0);
  else if (scale === 'week') {
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    d.setUTCHours(0, 0, 0, 0);
  } else if (scale === 'month') {
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
  } else if (scale === 'year') {
    d.setUTCMonth(0, 1);
    d.setUTCHours(0, 0, 0, 0);
  }

  return d;
};

/**
 * Determines the appropriate timescale based on the duration between two dates.
 * @param startDate - The starting boundary (Date object, string, or millisecond timestamp)
 * @param endDate - The ending boundary (Date object, string, or millisecond timestamp)
 * @returns The calculated Timescale string
 */
export function deriveScale(startDate: Date | string | number, endDate: Date | string | number): TimeScale | undefined {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = end.getTime() - start.getTime();

  if (isNaN(diffInMs) || diffInMs < 0) return;

  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  switch (true) {
    case diffInMs <= 1000 * 60 * 60:
      return 'minute';
    case diffInDays <= 2:
      return 'hour';
    case diffInDays <= 13:
      return 'day';
    case diffInDays <= 60:
      return 'week';
    case diffInDays <= 730:
      return 'month';
    default:
      return 'year';
  }
}
