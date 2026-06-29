import type { Core } from '@strapi/strapi';
import type koa from 'koa';

const TYPE_FULL = ['action', 'timestamp', 'url', 'event_documentId', 'event_model', 'metadata'];
const TYPE_MINIMAL = ['action', 'timestamp'];

type TimeScale = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

interface TimeSeriesPoint {
  x: string | Date;
  y: number;
}

/**
 * Determine the interval scale depending on the date range duration to provide best-fit graph resolution.
 * @param startDate the start date of the range
 * @param endDate the end date of the range
 * @returns the appropriate time scale for the given date range
 */
const deriveScale = (startDate: Date, endDate: Date): TimeScale | undefined => {
  const diffInMs = endDate.getTime() - startDate.getTime();

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
};

/**
 * Calculate the count of intervals between the date borders to build consecutive array buckets.
 * @param scale the timescale to calculate
 * @param start the start date
 * @param end the end date
 * @returns the number of intervals between the start and end dates for the given scale
 */
const startTime = (scale: TimeScale, start: Date, end: Date): number => {
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
 * Truncate/anchor datetimes on specific timescale intervals to query and display aligned boundaries.
 * @param scale the timescale to anchor to
 * @param end the end date to anchor
 * @returns a new Date object representing the anchored end date
 */
const endTime = (scale: TimeScale, end: Date): Date => {
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
 * Populate missing date/time intervals with zero-valued records to render complete continuous trendlines.
 * @param rawPoints the raw data points to pad
 * @param scale the timescale to pad to
 * @param quantity the number of intervals to pad
 * @param anchorTimestamp optional timestamp to anchor the end of the padded series
 * @returns an array of padded data points with x as ISO string and y as number
 */
const padTimeSeries = (
  rawPoints: TimeSeriesPoint[],
  scale: TimeScale,
  quantity: number,
  anchorTimestamp?: Date | string
): { x: string; y: number }[] => {
  if (quantity <= 0) return [];

  let maxTime: number;
  if (anchorTimestamp) {
    maxTime = new Date(anchorTimestamp).getTime();
  } else {
    maxTime = rawPoints.length > 0 ? Math.max(...rawPoints.map((d) => new Date(d.x).getTime())) : Date.now();
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

  for (const item of rawPoints) {
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
      dataLookup.set(bucketKey, currentVal + (item.y || 0));
    }
  }

  const paddedResult: { x: string; y: number }[] = [];
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
 * Helper function to fetch analytics data from the backend
 * @param last string in the format of <number><unit> where unit is m (minute), h (hour), or d (day)
 * @returns timestamp in milliseconds representing the current time minus the specified duration, or null if the input is invalid
 */
const parseLastToTimestamp = (last?: string) => {
  if (!last || typeof last !== 'string') return null;

  const match = last.trim().match(/^(\d+)([mhd]|mth)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unitMs: Record<string, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    mth: 30 * 24 * 60 * 60 * 1000,
  };

  const ms = unitMs[unit];
  if (!ms) return null;

  return Date.now() - amount * ms;
};

const toTimestamp = (value?: string) => {
  if (value === undefined || value === null || value === '') return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;

  return numeric;
};

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Controller to get analytics data
   * @param ctx request context
   */
  getAnalyticsData: async (ctx: koa.Context & { request: { query: Record<string, any> } }) => {
    const { query } = ctx.request || {};

    try {
      const filters: Record<string, any> = {};
      if (query.action) filters.action = query.action;
      if (query.url) filters.url = query.url;
      if (query.uid) filters.event_model = query.uid;
      if (query.documentId) filters.event_documentId = query.documentId;
      if (query.referrer) filters.referrer = query.referrer;

      const hasStartDate = query.startDate !== undefined && query.startDate !== '';
      const hasEndDate = query.endDate !== undefined && query.endDate !== '';
      const hasLast = query.last !== undefined && query.last !== '';

      const startTimestamp = toTimestamp(query.startDate);
      const endTimestamp = toTimestamp(query.endDate);
      const lastTimestamp = parseLastToTimestamp(query.last);

      if ((hasStartDate && startTimestamp === null) || (hasEndDate && endTimestamp === null)) {
        return ctx.throw(400, 'startDate and endDate must be numeric millisecond timestamps');
      }

      if (hasLast && lastTimestamp === null) {
        return ctx.throw(400, 'last must match format: <number><m|h|d|mth>');
      }

      // If both absolute startDate and relative last are provided, use the stricter lower bound.
      const lowerBound =
        startTimestamp !== null && lastTimestamp !== null
          ? Math.max(startTimestamp, lastTimestamp)
          : (startTimestamp ?? lastTimestamp);

      if (lowerBound !== null || endTimestamp !== null) {
        filters.timestamp = {};
        if (lowerBound !== null) filters.timestamp.$gte = lowerBound;
        if (endTimestamp !== null) filters.timestamp.$lte = endTimestamp;
      }

      if (lowerBound !== null && endTimestamp !== null && lowerBound > endTimestamp) {
        return ctx.throw(400, 'start timestamp must be less than or equal to end timestamp');
      }

      const data = await strapi.documents('plugin::strapi-analytics.event').findMany({
        filters,
        fields: query.type === 'full' ? TYPE_FULL : TYPE_MINIMAL,
      });

      ctx.send(data);
    } catch (error) {
      ctx.throw(500, 'An error occurred while fetching analytics data');
    }
  },
  /**
   * Controller to get the display name of a content type by its UID
   * @param ctx request context
   */
  getDisplayName: async (ctx: koa.Context) => {
    const { uid } = ctx.params || {};

    if (!uid) return ctx.throw(400, 'Content type UID is required');

    try {
      const contentType = strapi.contentTypes[uid];
      if (!contentType) return ctx.throw(404, 'Content type not found');

      const displayName = contentType.info?.displayName || contentType.modelName || uid;

      ctx.send({ displayName });
    } catch (error) {
      ctx.throw(500, 'An error occurred while fetching the content type display name');
    }
  },
  /**
   * Get stored tracking code to be injected into the frontend
   * @param ctx request context
   */
  getCode: async (ctx: koa.Context) => {
    try {
      const codeEntry = await strapi.documents('plugin::strapi-analytics.code').findFirst();

      ctx.send({ code: codeEntry?.code || null });
    } catch (error) {
      ctx.throw(500, 'An error occurred while fetching the code');
    }
  },
  /**
   * Generate a new code for tracking and store it in the database
   * @param ctx request context
   */
  generateCode: async (ctx: koa.Context) => {
    try {
      const newCode = `S-${Math.random().toString(36).substr(2, 16).toUpperCase()}`;
      const existingEntry = await strapi.documents('plugin::strapi-analytics.code').findFirst();

      if (existingEntry) {
        await strapi.documents('plugin::strapi-analytics.code').update({
          documentId: existingEntry.documentId,
          data: { code: newCode } as any,
        });
      } else {
        await strapi.documents('plugin::strapi-analytics.code').create({
          data: { code: newCode },
        });
      }

      ctx.send({ code: newCode });
    } catch (error) {
      ctx.throw(500, 'An error occurred while generating the code');
    }
  },
  /**
   * Save a layout for the current admin user
   * @param ctx request context
   */
  saveLayout: async (ctx: koa.Context) => {
    try {
      const { body } = ctx.request || {};
      const user = ctx.state.user || {};
      const userId = user.id;

      if (!userId) return ctx.throw(401, 'Unauthorized');

      const { isGlobal = false, modelUid, layout } = body || {};
      if (!layout) return ctx.throw(400, 'layout is required');

      const result = await strapi.plugin('strapi-analytics').service('layouts').saveLayout({
        userId,
        isGlobal,
        modelUid,
        layout,
      });

      ctx.send(result);
    } catch (err) {
      ctx.throw(500, 'An error occurred while saving the layout');
    }
  },
  /**
   * Get layouts for the current admin user (or all if admin requests)
   * @param ctx request context
   */
  getLayouts: async (ctx: koa.Context) => {
    try {
      const { query } = ctx.request || {};
      const user = ctx.state.user || {};
      const userId = user.id;

      const { isGlobal, modelUid, forUserId } = query || {};

      // Allow admins to request other users' layouts via forUserId, otherwise use current user
      const targetUserId = forUserId ? Number(forUserId) : userId;

      const parsedIsGlobal =
        isGlobal === undefined || isGlobal === ''
          ? undefined
          : isGlobal === 'true' || isGlobal === true;

      const results = await strapi.plugin('strapi-analytics').service('layouts').getLayouts({
        userId: targetUserId,
        isGlobal: parsedIsGlobal,
        modelUid,
      });

      ctx.send(results);
    } catch (err) {
      ctx.throw(500, 'An error occurred while fetching layouts');
    }
  },
  /**
   * Get pre-formatted dashboard summary and chart data based on the requested user layout.
   * @param ctx request context
   */
  getDashboardData: async (ctx: koa.Context & { request: { body: any } }) => {
    const { start, end, uid, layout } = ctx.request.body || {};

    if (!start || !end) {
      return ctx.throw(400, 'start and end dates are required');
    }

    if (!Array.isArray(layout)) {
      return ctx.throw(400, 'layout must be an array of widgets');
    }

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return ctx.throw(400, 'Invalid start or end date format');
      }

      const filters: Record<string, any> = {
        timestamp: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
      };

      if (uid) {
        filters.event_model = uid;
      }

      // Query database once for the requested date and model
      const events = await strapi.documents('plugin::strapi-analytics.event').findMany({
        filters,
        fields: ['action', 'timestamp', 'url'],
      });

      const widgetData: Record<string, any> = {};

      for (const widget of layout) {
        if (!widget || !widget.id || !widget.type) continue;

        const filteredEvents = events.filter(
          (e: any) => widget.metric === 'all' || e.action === widget.metric
        );

        if (widget.type === 'datacard') {
          widgetData[widget.id] = { value: filteredEvents.length };
        } else if (widget.type === 'area_chart' || widget.type === 'bar_chart') {
          const scale = deriveScale(startDate, endDate) || 'day';
          const quantity = startTime(scale, startDate, endDate);
          const anchor = endTime(scale, endDate);

          const rawPoints = filteredEvents.map((e: any) => ({
            x: e.timestamp,
            y: 1,
          }));

          const padded = padTimeSeries(rawPoints, scale, quantity, anchor);
          widgetData[widget.id] = { data: padded, scale };
        } else if (widget.type === 'pie_chart') {
          const groupKey = widget.metric === 'all' ? 'action' : 'url';
          const counts: Record<string, number> = {};

          for (const e of filteredEvents) {
            const val = e[groupKey] || 'Unknown';
            counts[val] = (counts[val] || 0) + 1;
          }

          const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          let pieData: { name: string; value: number }[] = [];

          if (sortedEntries.length <= 6) {
            pieData = sortedEntries.map(([name, value]) => ({ name, value }));
          } else {
            const topEntries = sortedEntries.slice(0, 5);
            const otherCount = sortedEntries.slice(5).reduce((acc, curr) => acc + curr[1], 0);
            pieData = topEntries.map(([name, value]) => ({ name, value }));
            pieData.push({ name: 'Other', value: otherCount });
          }

          widgetData[widget.id] = { data: pieData };
        } else if (widget.type === 'funnel_chart') {
          const groupKey = widget.metric === 'all' ? 'action' : 'url';
          const counts: Record<string, number> = {};

          for (const e of filteredEvents) {
            const val = e[groupKey] || 'Unknown';
            counts[val] = (counts[val] || 0) + 1;
          }

          const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          const totalMax = sortedEntries.length > 0 ? sortedEntries[0][1] : 1;
          const funnelData = sortedEntries.slice(0, 5).map(([name, value]) => ({
            name,
            value,
            percent: totalMax > 0 ? (value / totalMax) * 100 : 0,
          }));

          widgetData[widget.id] = { data: funnelData };
        }
      }

      ctx.send({ widgetData });
    } catch (error) {
      strapi.log.error('Error fetching dashboard summary data:', error);
      ctx.throw(500, 'An error occurred while fetching dashboard summary data');
    }
  },
});

export default controller;
