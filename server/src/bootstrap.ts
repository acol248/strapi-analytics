import type { Core } from '@strapi/strapi';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const actions = [
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'dashboard.read',
      pluginName: 'strapi-analytics',
    },
    {
      section: 'settings',
      category: 'strapi-analytics',
      displayName: 'Read',
      uid: 'settings.read',
      pluginName: 'strapi-analytics',
    },
    {
      section: 'settings',
      category: 'strapi-analytics',
      displayName: 'Create',
      uid: 'settings.create',
      pluginName: 'strapi-analytics',
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};

export default bootstrap;
