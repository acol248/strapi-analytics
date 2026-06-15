const pluginPermissions = {
  dashboard: [{ action: 'plugin::strapi-analytics.dashboard.read', subject: null }],
  settings: [
    { action: 'plugin::strapi-analytics.settings.read', subject: null },
    { action: 'plugin::strapi-analytics.settings.create', subject: null },
  ],
};

export default pluginPermissions;
