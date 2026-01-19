import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { categorySelect, getSpirits, productSelect } from '$lib/server/core';


export const GET: RequestHandler = async ({ url }) => {
  switch(url.pathname) {
    case '/api/select/categories': {
      const response = await categorySelect();
      return json(response);
    }


    // TODO: this may need to be replaced
    case '/api/select/spirits': {
      const response = await getSpirits();
      return json(response);
    }

    case '/api/select/products': {
      const response = await productSelect();
      return json(response);
    }


    default:
      return json({ message: 'Route not found!' });
  }
};