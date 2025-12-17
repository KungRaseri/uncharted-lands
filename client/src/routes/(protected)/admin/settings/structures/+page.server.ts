import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { SERVER_API_URL } from '$env/static/private';

interface StructureMetadata {
	id: string;
	name: string;
	displayName: string;
	description: string;
	category: 'EXTRACTOR' | 'BUILDING';
	extractorType: string | null;
	buildingType: string | null;
	tier: number;
	costs: Record<string, number>;
	constructionTimeSeconds: number;
	populationRequired: number;
	modifiers: Array<{
		type: string;
		name: string;
		value: number;
		formula: string;
	}>;
	prerequisites: string[];
	// Optional properties that may be present in the API response
	baseCost?: Record<string, number>;
	baseProduction?: Record<string, number>;
	enabled?: boolean;
	capacity?: number;
	storageBonus?: number;
	defenseBonus?: number;
}

export const load: PageServerLoad = async ({ cookies }) => {
	// Fetch structure metadata from API
	const sessionToken = cookies.get('session');

	try {
		const response = await fetch(`${SERVER_API_URL}/structures/metadata`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch structures: ${response.statusText}`);
		}

		const apiResponse = await response.json();
		const allStructures = (apiResponse.data as StructureMetadata[]) || [];

		// Organize structures by category
		const structures = {
			extractors: allStructures.filter((s) => s.category === 'EXTRACTOR'),
			buildings: allStructures.filter((s) => s.category === 'BUILDING')
		};

		return { structures };
	} catch (error) {
		console.error('[Admin Settings] Error fetching structures:', error);

		// Return empty structure lists on error
		return {
			structures: {
				extractors: [],
				buildings: []
			},
			error: 'Failed to load structure data from server'
		};
	}
};

export const actions: Actions = {
	updateStructure: async ({ request }) => {
		const formData = await request.formData();
		const structureId = formData.get('structureId') as string;
		const enabled = formData.get('enabled') === 'true';

		// This would update structure configuration in the database
		console.log('Update structure:', structureId, enabled);

		return fail(400, {
			error: 'Structure modification requires database implementation. This feature will be added when structure templates are moved to the database.'
		});
	}
};
