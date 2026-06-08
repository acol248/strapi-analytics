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
  ],
});
