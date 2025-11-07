// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="@sveltejs/kit" />

// Import shared types
import type { PlayerProfile } from './lib/types/game';

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

// and what to do when importing types
declare global {
	namespace App {
		interface Error {
			message: string;
			errorId: string
		}
		interface Locals {
			account: (Account & {
				profile: PlayerProfile | null
			}) | null
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}