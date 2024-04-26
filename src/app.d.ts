// See https://kit.svelte.dev/docs/types#app

import type { User } from "$lib/types";

// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string | null,
			type: string | null;
			code: string | number | null;

		}
		interface Locals {
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
