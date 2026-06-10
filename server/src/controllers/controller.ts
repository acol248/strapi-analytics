import type { Core } from '@strapi/strapi';

const TYPE_FULL = ['action', 'timestamp', 'url', 'event_documentId', 'event_model', 'metadata'];
const TYPE_MINIMAL = ['action', 'timestamp'];

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
      if (query.startDate || query.endDate) {
        filters.timestamp = {};
        if (query.startDate) filters.timestamp.$gte = new Date(query.startDate);
        if (query.endDate) filters.timestamp.$lte = new Date(query.endDate);
      }

      const data = await strapi.documents('plugin::strapi-analytics.event').findMany({
        where: filters,
        fields: query.type === 'full' ? TYPE_FULL : TYPE_MINIMAL,
      });

      ctx.send(data);
    } catch (error) {
      ctx.throw(500, 'An error occurred while fetching analytics data');
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
