import { categorySelect } from "$lib/server/core";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
  let response = await categorySelect();
  return json(response);
};