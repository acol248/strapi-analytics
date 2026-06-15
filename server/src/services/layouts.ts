import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async saveLayout({ userId, isGlobal = false, modelUid, layout }: any) {
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
  async getLayouts({ userId, isGlobal, modelUid }: any) {
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (isGlobal !== undefined) filters.isGlobal = isGlobal;
    if (modelUid) filters.modelUid = modelUid;

    const results = await strapi.documents('plugin::strapi-analytics.layout').findMany({ filters });
    return results;
  },
});

export default service;
