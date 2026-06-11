# Strapi Analytics

A standalone anonymous analytics plugin for Strapi CMS.

## Getting Started

### Installing Plugin

Installation via npm coming soon...  
For now, copy plugin files to Strapi plugins folder and add the following to your plugins file.

```
...
"strapi-analytics": {
  enabled: true,
  resolve: "./src/plugins/strapi-analytics",
},
...
```

### Adding the tracking script to your website

Paste the following snippet into the <head> of your website's HTML layout. This script initializes the global sana tracker asynchronously, meaning it won't impact your site's loading performance.

```js
<!-- Strapi Analytics Plugin -->
<script>
  (function(w,d,s,o,g,r,a,m){
    w['StrapiAnalyticsObject']=g;
    w[g]=w[g]||function(){ (w[g].q=w[g].q||[]).push(arguments) },w[g].l=1*new Date();
    a=d.createElement(s),m=d.getElementsByTagName(s)[0];
    a.async=1;a.src=o;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://your-strapi-domain.com/api/strapi-analytics/tracker.js','sana');

  sana('init', 'S-XXXXXXXXXXX'); // replace this with a code generated in your CMS
  sana('pageview');
</script>
<!-- End Strapi Analytics Plugin -->
```

### Tracking functions

#### Page View

Tracks a standard Page View action (page_view) inside the collection.

```js
sana('pageview', { customMetadataKey: 'value' });
```

#### Custom actions

Send custom events (e.g., standard action types configured in the schema like click, file_download, form_submit, search, scroll, or custom).

```js
sana('track', 'click', { buttonId: 'signup' });
```

#### Granular Content & Document Validation

Link specific actions directly to models and existing documents in your database. The API automatically validates that both the model and the specified document exist. This prevents data injection errors and enforces schema integrity.

```js
sana(
  'track',
  'click',
  { campaign: 'summer_sale_2026' }, // Custom metadata
  { uid: 'api::product.product', documentId: 'prod_abc123xyz' } // Strapi Content-Type Details
);
```

### Supported actions

- page_view
- click
- file_download
- form_submit
- search
- scroll
- custom

## Roadmap

- [x] ~~Add a token/key requirement to track endpoint that prevents unauthorized access.~~
- [x] ~~Create copy/paste script that can be added to users websites allowing easy interaction with analytics tracking.~~
- [ ] Add content type specific dashboards.
- [ ] Improve customisability of the overview page.
- [ ] Add drilled down layers that allow for granular tracking - track the CT, the documentId, how data in the document is interacted with.
- [ ] npm installation method.

Please feel free to suggest further features for the roadmap.
