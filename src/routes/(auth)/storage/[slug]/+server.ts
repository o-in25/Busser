import { getSignedUrlFromUnsignedUrl } from '$lib/server/storage';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies, url }): Promise<Response> => {
  const body = await request.json();
  switch(url.pathname) {
    case '/storage/get-signed-url':
      const signed = await getSignedUrlFromUnsignedUrl(body.unsignedUrl);
      return json({ signed });
    default:
      return json({ message: 'Route not found!' });
  }
};