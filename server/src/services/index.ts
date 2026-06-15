// Types
import type { Core } from '@strapi/strapi';

export interface TrackEventData {
  event: string;
  url: string;
  referrer: string;
  strapi?: {
    uid: string;
    documentId?: string;
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}

export default {
  analytics: ({ strapi }: { strapi: Core.Strapi }) => ({
    /**
     * Tracks an analytics event by creating a new document in the database.
     * @param eventData - The data related to the event being tracked
     */
    trackEvent: async (eventData: TrackEventData) => {
      if (!eventData.event || !eventData.url || !eventData.timestamp) {
        strapi.log.warn('Event name, URL, and timestamp are required to track an analytics event.');
        return;
      }

      try {
        const data = {
          action: eventData.event,
          url: eventData.url,
          event_model: eventData.strapi?.uid,
          event_documentId: eventData.strapi?.documentId,
          referrer: eventData.referrer,
          timestamp: eventData.timestamp,
          metadata: eventData.metadata || {},
        };

        await strapi.documents('plugin::strapi-analytics.event').create({ data });
      } catch (err) {
        strapi.log.error('Error tracking analytics event:', err);
      }
    },
  }),
  layouts: ({ strapi }: { strapi: Core.Strapi }) => ({
    saveLayout: async ({ userId, isGlobal = false, modelUid, layout }: any) => {
      if (!userId) throw new Error('userId is required');

      const filters: any = { userId };
      if (isGlobal) filters.isGlobal = true;
      else filters.isGlobal = false;
      if (!isGlobal && modelUid) filters.modelUid = modelUid;

      const existing = await strapi.documents('plugin::strapi-analytics.layout').findFirst({ filters });

      if (existing) {
        await strapi.documents('plugin::strapi-analytics.layout').update({
          documentId: existing.documentId,
          data: { layout, isGlobal, modelUid, userId } as any,
        });
        return { ...existing, layout };
      }

      const created = await strapi.documents('plugin::strapi-analytics.layout').create({
        data: { layout, isGlobal, modelUid, userId },
      });

      return created;
    },
    getLayouts: async ({ userId, isGlobal, modelUid }: any) => {
      const filters: any = {};
      if (userId) filters.userId = userId;
      if (isGlobal !== undefined) filters.isGlobal = isGlobal;
      if (modelUid) filters.modelUid = modelUid;

      const results = await strapi.documents('plugin::strapi-analytics.layout').findMany({ filters });
      return results;
    },
  }),
};
