export type TimeScale = 'minute' | 'hour' | 'day';

export interface TimeSeriesPoint {
  x: number | string;
  y: number | string;
  [key: string]: any;
}

/**
 * Pads a time-series array with zero-valued data points for missing intervals within a strict window.
 * @param data - The array of existing data points.
 * @param scale - The time unit interval ('minute', 'hour', or 'day').
 * @param quantity - The total number of intervals to return in the sequence.
 * @param anchorTimestamp - Optional. Fixes the end of the time window. Counts backward from here.
 * @returns A continuous, strictly bounded array of data points padded with 0.
 */
export function padTimeSeries<T extends TimeSeriesPoint>(
  data: T[],
  scale: TimeScale,
  quantity: number,
  anchorTimestamp?: string | Date
): TimeSeriesPoint[] {
  if (quantity <= 0) return [];

  let maxTime: number;
  if (anchorTimestamp) {
    maxTime = new Date(anchorTimestamp).getTime();
  } else {
    maxTime =
      data.length > 0 ? Math.max(...data.map((d) => new Date(d.x).getTime())) : Date.now();
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
}
