/**
 * Authentication guard utilities for server-side routes
 */

import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { PlayerProfile } from '@uncharted-lands/shared';

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

type AuthenticatedAccount = Account & {
	profile: PlayerProfile;
};

/**
 * Type guard to ensure account exists and has required profile
 */
export function requireAuth<T extends RequestEvent>(
	event: T
): asserts event is T & {
	locals: T['locals'] & { account: AuthenticatedAccount };
} {
	if (!event.locals.account) {
		throw redirect(302, '/sign-in');
	}

	if (!event.locals.account.profile) {
		throw redirect(302, '/game/getting-started');
	}
}

/**
 * Type guard to ensure account exists (profile can be null)
 */
export function requireAccount<T extends RequestEvent>(
	event: T
): asserts event is T & {
	locals: T['locals'] & { account: Account & { profile: PlayerProfile | null } };
} {
	if (!event.locals.account) {
		throw redirect(302, '/sign-in');
	}
}
