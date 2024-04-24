import type { PageServerLoad } from "./$types";
import { AuthService } from '$lib/server/auth';
const authService = new AuthService();
export const load: PageServerLoad = async ({ params }) => {
    let rows = await authService.getAllUsers();
    let users = rows?.map(user => JSON.parse(JSON.stringify(user)))
    return { users };
};