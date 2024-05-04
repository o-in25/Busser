import type { PageServerLoad } from "./$types";
import type { User } from "$lib/types";
import { DbProvider } from "$lib/server/db";
import { fail, json } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";
import { hashPassword } from "$lib/server/auth";
import { addUser } from "$lib/server/auth";
const db = new DbProvider();

export const load: PageServerLoad = async () => {
    let users = await db.table<User>('Users');
    users = users.map(user => Object.assign({}, user));
    return { users };
};

export const actions = {
    addUser: async ({ request }) => {
        const formData: any = await request.formData();
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        // check 2 passwords
        const result = await addUser({ username, email, password } as User, password);
        console.log(result);
        return {};
    }
};