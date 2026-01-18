import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json({});
};

export const POST: RequestHandler = async () => {
  // Registration emails are sent via the signup flow, not this endpoint
  return error(501, 'Not implemented');
};