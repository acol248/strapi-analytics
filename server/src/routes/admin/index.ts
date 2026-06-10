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
  ],
});
