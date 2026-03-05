import { fail } from '@sveltejs/kit';

import { addUser, roleSelect } from '$lib/server/user';

export const load = async () => {
	const roles = await roleSelect();
	return { roles };
};

const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString().trim() || '';
		const email = formData.get('email')?.toString().trim() || '';
		const password = formData.get('password')?.toString() || '';
		const passwordConfirm = formData.get('passwordConfirm')?.toString() || '';
		const roles = formData.get('roles')?.toString() || '';

		const errors = {
			username: { hasError: false, message: '' },
			email: { hasError: false, message: '' },
			password: { hasError: false, message: '' },
			passwordConfirm: { hasError: false, message: '' },
		};

		if (!username) {
			errors.username = { hasError: true, message: 'Username is required.' };
		}

		if (!email) {
			errors.email = { hasError: true, message: 'Email is required.' };
		} else {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				errors.email = { hasError: true, message: 'Email is not valid.' };
			}
		}

		if (!password) {
			errors.password = { hasError: true, message: 'Password is required.' };
		}

		if (!passwordConfirm) {
			errors.passwordConfirm = { hasError: true, message: 'Password confirmation is required.' };
		} else if (password !== passwordConfirm) {
			errors.password = { hasError: true, message: 'Passwords do not match.' };
			errors.passwordConfirm = { hasError: true, message: 'Passwords do not match.' };
		}

		const hasErrors = Object.values(errors).some((field) => field.hasError);
		if (hasErrors) {
			return fail(400, { errors });
		}

		let user = await addUser(username, email, password, roles ? roles.split(',') : []);
		if (!user) {
			return fail(500, { error: 'Could not create user.' });
		}

		return {
			success: { message: 'User has been created.' },
		};
	},
};

export { actions };
