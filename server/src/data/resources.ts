/**
 * Resource Master Data
 * Single source of truth for all resources in the game
 */

export interface ResourceDefinition {
	name: string;
	description: string;
	category: 'plot' | 'energy' | 'consumable' | 'material';
}

export const RESOURCES: ResourceDefinition[] = [
	{
		name: 'food',
		description: 'Food resource',
		category: 'consumable',
	},
	{
		name: 'water',
		description: 'Water resource',
		category: 'consumable',
	},
	{
		name: 'wood',
		description: 'Wood building material',
		category: 'material',
	},
	{
		name: 'stone',
		description: 'Stone building material',
		category: 'material',
	},
	{
		name: 'ore',
		description: 'Ore building material',
		category: 'material',
	},
];
