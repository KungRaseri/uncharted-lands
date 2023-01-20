// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="@sveltejs/kit" />


// and what to do when importing types
declare namespace App {
	import type { Account, Role, Profile } from "@prisma/client"

	interface Locals {
		account: Account = {
			id: string,
			email: string,
			role: Role,
			userAuthToken: string,
			Profile: Profile,
			createdAt: Date,
			updatedAt: Date
		}
	}
	// interface Platform {}
	// interface PrivateEnv {}
	// interface PublicEnv {}
}