// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="@sveltejs/kit" />

import type { Account, Role } from "@prisma/client"

// and what to do when importing types
declare namespace App {
	interface Locals {
		account: Account = {
			email: string,
			username: string,
			role: Role
		}
	}
	// interface Platform {}
	// interface PrivateEnv {}
	// interface PublicEnv {}
}
