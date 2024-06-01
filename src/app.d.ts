// See https://kit.svelte.dev/docs/types#app

import type { User } from "$lib/types";

// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			reason: string,
			code: number,
      message?: string
		}
		interface Locals {
			user: User | null;
		}

		interface PageData {
      args: any,
      error?: Error | null
    }
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
