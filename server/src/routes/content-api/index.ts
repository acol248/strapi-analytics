export default () => ({
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/tracker.js',
      handler: 'api.trackerScript',
      config: {
        auth: false,
      },
    },
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
