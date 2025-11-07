// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="@sveltejs/kit" />

// Local type definitions (previously from Prisma)
type Role = 'MEMBER' | 'SUPPORT' | 'ADMINISTRATOR';

interface Account {
	id: string;
	email: string;
	passwordHash: string;
	userAuthToken: string;
	role: Role;
	createdAt: Date;
	updatedAt: Date;
}

interface Profile {
	id: string;
	username: string;
	picture: string;
	accountId: string;
}

// and what to do when importing types
declare namespace App {
	interface Error {
		message: string;
		errorId: string
	}
	interface Locals {
		account: (Account & {
			profile: Profile | null
		}) | null
	}
	// interface Platform {}
	// interface PrivateEnv {}
	// interface PublicEnv {}
}