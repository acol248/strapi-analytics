// Types
import type { Core } from '@strapi/strapi';
import type koa from 'koa';

const api = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Track analytics event data
   * @param ctx koa request context
   */
  async track(ctx: koa.Context) {
    const { body } = ctx.request || {};

    try {
      // if we're specifying a model and document, check they exist before tracking the event
      if (body.strapi?.uid || body.strapi?.documentId) {
        const hasModel = strapi.contentTypes[body.strapi.uid];
        const hasDocument = await strapi.documents('plugin::strapi-analytics.event').findFirst({
          filters: { event_documentId: body.strapi.documentId, event_model: body.strapi.uid },
        });

        if (!(body.strapi.uid && hasModel) || !(body.strapi.documentId && hasDocument)) {
          ctx.throw(404, 'Bad Strapi data.');
        }
      }

      // track event data
      const data = { ...body, timestamp: new Date() };
      await strapi.plugin('strapi-analytics').service('analytics').trackEvent(data);

      ctx.body = { status: 200, message: 'Analytics data tracked successfully.' };
    } catch (err) {
      strapi.log.error('Error tracking analytics data:', err);
      ctx.throw(500, 'Internal server error');
    }
  },
});

export default api;
