import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async () => {
  return json({ name: 'eoin' });

};