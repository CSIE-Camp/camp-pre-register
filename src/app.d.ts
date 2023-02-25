/// <reference types="@cloudflare/workers-types" />
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface Platform {
			env?: {
				DB?: Fetcher;
				__D1_BETA__DB?: Fetcher;
				HERMES_TOKEN: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
		}
	}
}

export {};
