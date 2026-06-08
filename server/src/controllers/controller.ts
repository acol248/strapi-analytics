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
});

export default controller;
