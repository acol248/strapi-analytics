export type TimeScale = 'minute' | 'hour' | 'day';

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
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const randomPart = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${randomPart()}${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}${randomPart()}${randomPart()}`;
};

/**
 * Pads a time-series array with zero-valued data points for missing intervals within a strict window.
 * @param data - The array of existing data points.
 * @param scale - The time unit interval ('minute', 'hour', or 'day').
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

  const startDate = new Date(endDate);
  if (scale === 'day') startDate.setUTCDate(startDate.getUTCDate() - (quantity - 1));
  else if (scale === 'hour') startDate.setUTCHours(startDate.getUTCHours() - (quantity - 1));
  else if (scale === 'minute') startDate.setUTCMinutes(startDate.getUTCMinutes() - (quantity - 1));

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const dataLookup = new Map<string, number>();

  for (const item of data) {
    const itemDate = new Date(item.x);
    if (scale === 'day') itemDate.setUTCHours(0, 0, 0, 0);
    else if (scale === 'hour') itemDate.setUTCMinutes(0, 0, 0);
    else if (scale === 'minute') itemDate.setUTCSeconds(0, 0);

    const itemMs = itemDate.getTime();

    if (itemMs >= startMs && itemMs <= endMs) {
      const bucketKey = itemDate.toISOString();
      const currentVal = dataLookup.get(bucketKey) || 0;
      dataLookup.set(bucketKey, currentVal + (typeof item.y === 'number' ? item.y : 0));
    }
  }

  const paddedResult: TimeSeriesPoint[] = [];
  const currentCursor = new Date(startDate);

  for (let i = 0; i < quantity; i++) {
    const currentKey = currentCursor.toISOString();
    const existingValue = dataLookup.get(currentKey);

    paddedResult.push({
      x: currentKey,
      y: existingValue !== undefined ? existingValue : 0,
    });

    if (scale === 'day') currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
    else if (scale === 'hour') currentCursor.setUTCHours(currentCursor.getUTCHours() + 1);
    else if (scale === 'minute') currentCursor.setUTCMinutes(currentCursor.getUTCMinutes() + 1);
  }

  return paddedResult;
};

/**
 * Compute the number of intervals between two dates (inclusive) for a given scale.
 * @param scale - The time unit interval ('minute', 'hour', or 'day').
 * @param start - The start date.
 * @param end - The end date.
 * @returns The number of intervals between the two dates (inclusive).
 */
export const startTime = (scale: TimeScale, start: Date, end: Date): number => {
  const diff = end.getTime() - start.getTime();

  if (scale === 'day') return Math.floor(diff / 864e5) + 1;

  if (scale === 'hour') return Math.floor(diff / 36e5) + 1;

  return Math.floor(diff / 6e4) + 1;
};

/**
 * Normalize an end `Date` to the provided scale (used as anchor timestamp).
 * @param scale - The time unit interval ('minute', 'hour', or 'day').
 * @param end - The end date.
 * @returns A new `Date` object normalized to the specified scale.
 */
export const endTime = (scale: TimeScale, end: Date): Date => {
  const d = new Date(end);
  if (scale === 'day') d.setUTCHours(0, 0, 0, 0);
  else if (scale === 'hour') d.setUTCMinutes(0, 0, 0);
  else if (scale === 'minute') d.setUTCSeconds(0, 0);
  return d;
};

/**
 * Derive the appropriate time scale based on the difference between two dates.
 * @param start - The start date.
 * @param end - The end date.
 * @returns The derived time scale ('minute', 'hour', or 'day').
 */
export const deriveScale = (start: Date, end: Date): TimeScale => {
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = diffMs / 6e4;

  if (diffMinutes >= 60 * 48) return 'day';

  if (diffMinutes >= 120) return 'hour';

  return 'minute';
};
