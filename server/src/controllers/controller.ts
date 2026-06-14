import type { Core } from '@strapi/strapi';

const TYPE_FULL = ['action', 'timestamp', 'url', 'event_documentId', 'event_model', 'metadata'];
const TYPE_MINIMAL = ['action', 'timestamp'];

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
  getAnalyticsData: async (ctx: any) => {
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
  getDisplayName: async (ctx: any) => {
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
  getCode: async (ctx: any) => {
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
  generateCode: async (ctx: any) => {
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
});

export default controller;
