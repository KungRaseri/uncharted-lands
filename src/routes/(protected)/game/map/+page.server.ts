// TODO: Migrate to REST API - create /api/worlds/:id/map endpoint with region/tile data
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    // STUB: This endpoint needs migration to REST API
    throw new Error('Map endpoint not yet migrated to REST API. Please use the server REST API.');
}) satisfies PageServerLoad;