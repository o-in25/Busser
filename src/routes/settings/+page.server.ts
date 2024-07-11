import type { PageServerLoad } from "./$types";
import { DbProvider } from "$lib/server/db";
const db = new DbProvider('user_t');

export const load: PageServerLoad = async () => {

};

export const actions = {

};