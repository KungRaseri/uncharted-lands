import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Load structure templates from the database enums
	const structures = {
		extractors: [
			{
				id: 'FARM',
				name: 'Farm',
				description: 'Produces food resources',
				category: 'EXTRACTOR',
				baseProduction: { FOOD: 10 },
				baseCost: { WOOD: 50, STONE: 20 },
				requirements: { area: 4, solar: 2, water: 3 },
				enabled: true
			},
			{
				id: 'LUMBER_MILL',
				name: 'Lumber Mill',
				description: 'Produces wood resources',
				category: 'EXTRACTOR',
				baseProduction: { WOOD: 8 },
				baseCost: { WOOD: 30, STONE: 40 },
				requirements: { area: 3, solar: 1, water: 1 },
				enabled: true
			},
			{
				id: 'QUARRY',
				name: 'Quarry',
				description: 'Produces stone resources',
				category: 'EXTRACTOR',
				baseProduction: { STONE: 8 },
				baseCost: { WOOD: 40, STONE: 30 },
				requirements: { area: 3, solar: 2, water: 1 },
				enabled: true
			},
			{
				id: 'MINE',
				name: 'Mine',
				description: 'Produces ore resources',
				category: 'EXTRACTOR',
				baseProduction: { ORE: 5 },
				baseCost: { WOOD: 60, STONE: 50 },
				requirements: { area: 2, solar: 1, water: 1 },
				enabled: true
			},
			{
				id: 'FISHING_DOCK',
				name: 'Fishing Dock',
				description: 'Produces food from water',
				category: 'EXTRACTOR',
				baseProduction: { FOOD: 12 },
				baseCost: { WOOD: 70, STONE: 10 },
				requirements: { area: 2, water: 5 },
				enabled: true
			},
			{
				id: 'HUNTERS_LODGE',
				name: 'Hunters Lodge',
				description: 'Produces pelts and food',
				category: 'EXTRACTOR',
				baseProduction: { PELTS: 3, FOOD: 5 },
				baseCost: { WOOD: 45, STONE: 25 },
				requirements: { area: 3, solar: 1 },
				enabled: true
			},
			{
				id: 'HERB_GARDEN',
				name: 'Herb Garden',
				description: 'Produces herbs for medicine',
				category: 'EXTRACTOR',
				baseProduction: { HERBS: 4 },
				baseCost: { WOOD: 35, STONE: 15 },
				requirements: { area: 2, solar: 3, water: 2 },
				enabled: true
			}
		],
		buildings: [
			{
				id: 'HOUSE',
				name: 'House',
				description: 'Provides housing for population',
				category: 'BUILDING',
				capacity: 5,
				baseCost: { WOOD: 30, STONE: 20 },
				requirements: { area: 2, solar: 1 },
				enabled: true
			},
			{
				id: 'STORAGE',
				name: 'Storage',
				description: 'Increases resource storage capacity',
				category: 'BUILDING',
				storageBonus: 1000,
				baseCost: { WOOD: 80, STONE: 50 },
				requirements: { area: 4 },
				enabled: true
			},
			{
				id: 'WORKSHOP',
				name: 'Workshop',
				description: 'Produces advanced goods and tools',
				category: 'BUILDING',
				baseCost: { WOOD: 60, STONE: 60, ORE: 30 },
				requirements: { area: 3, solar: 2 },
				enabled: true
			},
			{
				id: 'MARKETPLACE',
				name: 'Marketplace',
				description: 'Enables trading with other settlements',
				category: 'BUILDING',
				baseCost: { WOOD: 120, STONE: 80 },
				requirements: { area: 6, solar: 3 },
				enabled: true
			},
			{
				id: 'TOWN_HALL',
				name: 'Town Hall',
				description: 'Central administration building',
				category: 'BUILDING',
				baseCost: { WOOD: 200, STONE: 150, ORE: 50 },
				requirements: { area: 8, solar: 4 },
				enabled: true
			}
		]
	};

	return { structures };
};

export const actions: Actions = {
	updateStructure: async ({ request }) => {
		const formData = await request.formData();
		const structureId = formData.get('structureId') as string;
		const enabled = formData.get('enabled') === 'true';

		// This would update structure configuration in the database
		console.log('Update structure:', structureId, enabled);

		return fail(400, {
			error:
				'Structure modification requires database implementation. This feature will be added when structure templates are moved to the database.'
		});
	}
};
