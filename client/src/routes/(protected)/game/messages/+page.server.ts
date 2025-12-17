import type { PageServerLoad } from './$types';

export const load = (async ({ locals: _locals }) => {
	// Placeholder - will implement messaging system later
	return {
		conversations: [],
		unreadCount: 0
	};
}) satisfies PageServerLoad;
