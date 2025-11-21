import config from '@config';
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  if (config.adSense.enabled) {
    return new Response(config.adSense.adsTxt, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } else {
    return new Response('Page not found.', {
      status: 404,
    });
  }
};
