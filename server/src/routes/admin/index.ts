export default () => ({
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/data',
      handler: 'controller.getAnalyticsData',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/data/dashboard',
      handler: 'controller.getDashboardData',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/display-name/:uid',
      handler: 'controller.getDisplayName',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/code',
      handler: 'controller.getCode',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/generate-code',
      handler: 'controller.generateCode',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/layouts',
      handler: 'controller.saveLayout',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/layouts',
      handler: 'controller.getLayouts',
      config: {
        policies: [],
      },
    },
  ],
});
