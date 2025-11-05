// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="@sveltejs/kit" />


// and what to do when importing types
declare namespace App {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import type { Account, Role, Profile } from "@prisma/client"

	interface Error {
		message: string;
		errorId: string
	}
	interface Locals {
		account: Account & {
			profile: Profile | null
		}
	}
	// interface Platform {}
	// interface PrivateEnv {}
	// interface PublicEnv {}
}