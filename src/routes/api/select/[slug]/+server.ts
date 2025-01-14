import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { categorySelect, spiritSelect } from '$lib/server/core';
import { getSpirits } from '$lib/server/core';


export const GET: RequestHandler = async ({ url }) => {
  switch(url.pathname) {

    case '/api/select/categories': {
      const response = await categorySelect();
      return json(response);
    }


    case '/api/select/spirits': {
      const response = await getSpirits();
      console.log(response);
      return json(response);
    }

    default:
      return json({ message: 'Route not found!' });
  }
};