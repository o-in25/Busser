import type { PageServerLoad } from "./$types";
import { DbProvider } from "$lib/server/db";
const db = new DbProvider();

export const load: PageServerLoad = async () => {

};

export const actions = {

};