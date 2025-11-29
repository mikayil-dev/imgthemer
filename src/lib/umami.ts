import config from '@config';

interface UmamiEventPayload {
  url: string;
  name: string;
  hostname?: string;
  language?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  data?: Record<string, unknown>;
  id?: string; // distinct user id (optional, v2.18+)
}

export async function trackUmamiEvent(
  payload: UmamiEventPayload,
  request: Request,
): Promise<void> {
  if (!config.analytics.hostUrl || !config.analytics.id) {
    console.warn('Missing analytics URL or ID. Not sending payload to Umami.');
    return;
  }

  const body = {
    type: 'event',
    payload: {
      website: config.analytics.id,
      referrer: request.headers.get('referer') ?? 'direct',
      ...payload,
    },
  };

  try {
    await fetch(`${config.analytics.hostUrl}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') ?? 'Unknown User Agent',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('Failed to send Umami Event', err);
  }
}
