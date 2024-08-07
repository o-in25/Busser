import { categorySelect, searchInventory } from "$lib/server/core";
import { type RequestHandler, json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ request, url}) => {
  // const data = await request.json();
  const name = url.searchParams.get('name') || '';
  const result = await searchInventory(name);
  return json({ result });
};

