export default () => ({
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/track',
      handler: 'api.track',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
});
