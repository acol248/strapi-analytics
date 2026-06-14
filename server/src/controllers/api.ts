// Types
import type { Core } from '@strapi/strapi';
import type { TrackEventData } from 'src/services';
import type koa from 'koa';

const api = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Track analytics event data
   * @param ctx request context
   */
  async track(ctx: koa.Context) {
    const { body } = (ctx.request as any) || {};

    try {
      const codeEntry = await strapi.documents('plugin::strapi-analytics.code').findFirst();

      if (!codeEntry?.code) {
        ctx.throw(401, 'Analytics tracking code has not been set or configured.');
      }

      const headerCode = ctx.get('X-Analytics-Code');
      const authHeader = ctx.get('Authorization');
      const authHeaderCode =
        typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
          ? authHeader.slice(7).trim()
          : '';
      const bodyCode = body?.code || body?.analyticsCode || body?.strapi?.code;
      const queryCode = typeof ctx.query?.code === 'string' ? ctx.query.code : undefined;

      const providedCode = headerCode || authHeaderCode || bodyCode || queryCode;

      if (!providedCode || providedCode !== codeEntry?.code) {
        ctx.throw(401, 'Unauthorized: Invalid or missing tracking code.');
      }

      const data: TrackEventData = { ...body, timestamp: new Date() };

      // if we're specifying a model and document, check they exist before tracking the event
      if (body && (body.strapi?.uid || body.strapi?.documentId)) {
        const hasModel = strapi.contentTypes[body.strapi.uid];
        const hasDocument = await strapi.documents('plugin::strapi-analytics.event').findFirst({
          filters: { event_documentId: body.strapi.documentId, event_model: body.strapi.uid },
        });

        if (body.strapi?.uid && !hasModel) ctx.throw(404, 'Bad Strapi data.');
        else if (body.strapi?.documentId && !hasDocument) ctx.throw(404, 'Bad Strapi data.');
      }

      await strapi.plugin('strapi-analytics').service('analytics').trackEvent(data);

      ctx.body = { status: 200, message: 'Analytics data tracked successfully.' };
    } catch (err: any) {
      if (err.status || err.statusCode) throw err;

      strapi.log.error('Error tracking analytics data:', err);
      ctx.throw(500, 'Internal server error');
    }
  },
  /**
   * Serve the tracking script that can be injected into the frontend
   * @param ctx request context
   */
  async trackerScript(ctx: koa.Context) {
    const serverUrl =
      strapi.config.get('server.url') || `${ctx.secure ? 'https' : 'http'}://${ctx.host}`;

    const scriptContent = `
(function() {
  let siteCode = '';
  const endpoint = '${serverUrl}/api/strapi-analytics/track'; 

  function sendPayload(eventName, customData = {}, strapiData = null) {
    if (!siteCode) {
      console.warn('Strapi Analytics (sana): Missing initialization code.');
      return;
    }

    const payload = {
      code: siteCode,
      event: eventName,
      url: window.location.href,
      host: window.location.host,
      referrer: document.referrer || 'direct',
      metadata: customData,
      timestamp: new Date().toISOString()
    };

    if (strapiData && (strapiData.uid || strapiData.documentId)) {
      payload.strapi = {
        uid: strapiData.uid,
        documentId: strapiData.documentId
      };
    }

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(err => console.error('Strapi Analytics (sana) failure:', err));
    }
  }

  function handleCommand(args) {
    const command = args[0];
    if (command === 'init') { siteCode = args[1]; }
    else if (command === 'pageview') { sendPayload('page_view', args[1] || {}, args[2] || null); }
    else if (command === 'track') { sendPayload(args[1], args[2] || {}, args[3] || null); }
  }

  const globalName = window['StrapiAnalyticsObject']; // Will resolve to 'sana'
  const placeholderFunction = window[globalName];
  const queue = placeholderFunction ? placeholderFunction.q : [];

  window[globalName] = function() { handleCommand(arguments); };

  if (Array.isArray(queue)) {
    queue.forEach(handleCommand);
  }
})();
    `.trim();

    ctx.type = 'application/javascript';
    ctx.body = scriptContent;
  },
});

export default api;
