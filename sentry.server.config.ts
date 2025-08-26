// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://68a3d4194d468322ef8214b0b074f8cf@o4509593866993664.ingest.de.sentry.io/4509593868501072",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Reduce instrumentation in development to minimize warnings
  environment: process.env.NODE_ENV || 'development',
  
  // Disable some integrations in development to reduce noise
  integrations: function(integrations) {
    if (process.env.NODE_ENV !== 'production') {
      return integrations.filter(integration => {
        // Keep essential integrations, filter out noisy ones in dev
        return !['Prisma', 'Postgres'].includes(integration.name);
      });
    }
    return integrations;
  },
});
