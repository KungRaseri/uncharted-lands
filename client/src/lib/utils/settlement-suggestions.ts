/**
 * Settlement Suggestions Generator
 *
 * Analyzes settlement state and generates actionable suggestions
 * based on real game data (resources, population, structures, etc.)
 */

import type { ResourcesState } from '$lib/stores/game/resources.svelte';

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';
export type SuggestionCategory =
	| 'resources'
	| 'population'
	| 'construction'
	| 'expansion'
	| 'defense';

export interface Suggestion {
	id: string;
	priority: SuggestionPriority;
	category: SuggestionCategory;
	title: string;
	reasoning: string;
	actionLabel: string;
	actionHref: string;
	estimatedTime: string;
	impact: string;
}

interface SettlementStructure {
	id: string;
	structureId: string;
	category: string;
	level: number;
	health: number;
	maxLevel: number;
}

interface PopulationData {
	current: number;
	capacity: number;
	happiness: number;
}

interface SuggestionContext {
	settlementId: string;
	resources?: ResourcesState;
	population?: PopulationData;
	structures?: SettlementStructure[];
}

/**
 * Generate suggestions based on settlement state
 */
export function generateSuggestions(context: SuggestionContext): Suggestion[] {
	const suggestions: Suggestion[] = [];
	let suggestionId = 1;

	// Check resource shortages
	if (context.resources) {
		const resourceSuggestions = analyzeResources(context.resources, suggestionId);
		suggestions.push(...resourceSuggestions);
		suggestionId += resourceSuggestions.length;
	}

	// Check population capacity
	if (context.population) {
		const populationSuggestions = analyzePopulation(
			context.population,
			context.settlementId,
			suggestionId
		);
		suggestions.push(...populationSuggestions);
		suggestionId += populationSuggestions.length;
	}

	// Check structure health
	if (context.structures) {
		const structureSuggestions = analyzeStructures(
			context.structures,
			context.settlementId,
			suggestionId
		);
		suggestions.push(...structureSuggestions);
	}

	// Sort by priority (critical first)
	const priorityOrder: Record<SuggestionPriority, number> = {
		critical: 0,
		high: 1,
		medium: 2,
		low: 3
	};

	return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get the extractor name for a resource type
 */
function getExtractorName(type: string): string {
	const extractorMap: Record<string, string> = {
		food: 'Farm',
		water: 'Well',
		wood: 'Lumber Mill',
		stone: 'Quarry',
		ore: 'Mine'
	};
	return extractorMap[type] || 'Extractor';
}

/**
 * Analyze resources and generate suggestions
 */
function analyzeResources(resources: ResourcesState, startId: number): Suggestion[] {
	return [
		...checkResourceShortages(resources, startId),
		...checkStorageCapacity(resources, startId + 100),
		...checkLowProduction(resources, startId + 200)
	];
}

/**
 * Check for critical resource shortages
 */
function checkResourceShortages(resources: ResourcesState, startId: number): Suggestion[] {
	const suggestions: Suggestion[] = [];
	let id = startId;
	const resourceTypes = ['food', 'water', 'wood', 'stone', 'ore'] as const;

	for (const type of resourceTypes) {
		const resource = resources[type];
		if (!resource) continue;

		const netProduction = resource.productionRate - resource.consumptionRate;
		const currentAmount = resource.current;

		// CRITICAL: Running out soon
		if (netProduction < 0 && currentAmount > 0) {
			const hoursUntilEmpty = currentAmount / Math.abs(netProduction);

			if (hoursUntilEmpty < 3) {
				const resourceName = type.charAt(0).toUpperCase() + type.slice(1);
				suggestions.push({
					id: String(id++),
					priority: 'critical',
					category: 'resources',
					title: `Increase ${type} production`,
					reasoning: `${resourceName} consumption (${resource.consumptionRate.toFixed(1)}/hr) exceeds production (${resource.productionRate.toFixed(1)}/hr). You will run out in approximately ${hoursUntilEmpty.toFixed(1)} hours.`,
					actionLabel: `Build ${getExtractorName(type)}`,
					actionHref: `/game/build/${type}`,
					estimatedTime: '10 minutes',
					impact: 'High'
				});
			}
		}
	}

	return suggestions;
}

/**
 * Check storage capacity
 */
function checkStorageCapacity(resources: ResourcesState, startId: number): Suggestion[] {
	const suggestions: Suggestion[] = [];
	let id = startId;
	const resourceTypes = ['food', 'water', 'wood', 'stone', 'ore'] as const;

	for (const type of resourceTypes) {
		const resource = resources[type];
		if (!resource) continue;

		const currentAmount = resource.current;
		const capacity = resource.capacity;

		// HIGH: Storage near capacity
		if (currentAmount / capacity > 0.9) {
			const resourceName = type.charAt(0).toUpperCase() + type.slice(1);
			suggestions.push({
				id: String(id++),
				priority: 'high',
				category: 'resources',
				title: `Expand ${type} storage`,
				reasoning: `${resourceName} storage is at ${((currentAmount / capacity) * 100).toFixed(0)}% capacity. Resources will be wasted when storage is full.`,
				actionLabel: 'Build Warehouse',
				actionHref: '/game/build/warehouse',
				estimatedTime: '5 minutes',
				impact: 'Medium'
			});
		}
	}

	return suggestions;
}

/**
 * Check for low production rates
 */
function checkLowProduction(resources: ResourcesState, startId: number): Suggestion[] {
	const suggestions: Suggestion[] = [];
	let id = startId;
	const resourceTypes = ['food', 'water', 'wood', 'stone', 'ore'] as const;

	for (const type of resourceTypes) {
		const resource = resources[type];
		if (!resource) continue;

		const netProduction = resource.productionRate - resource.consumptionRate;

		// MEDIUM: Low production
		if (netProduction < 5 && resource.productionRate < 20) {
			suggestions.push({
				id: String(id++),
				priority: 'medium',
				category: 'resources',
				title: `Boost ${type} production`,
				reasoning: `Current ${type} production is low (${resource.productionRate.toFixed(1)}/hr). Consider building more extractors or upgrading existing ones.`,
				actionLabel: 'View Extractors',
				actionHref: `/game/settlements/${resources.settlementId}?focus=structures`,
				estimatedTime: '15 minutes',
				impact: 'Medium'
			});
		}
	}

	return suggestions;
}

/**
 * Analyze population and generate suggestions
 */
function analyzePopulation(
	population: PopulationData,
	settlementId: string,
	startId: number
): Suggestion[] {
	const suggestions: Suggestion[] = [];
	let id = startId;

	const capacityPercent = (population.current / population.capacity) * 100;

	// HIGH: Near capacity
	if (capacityPercent > 80) {
		suggestions.push({
			id: String(id++),
			priority: 'high',
			category: 'population',
			title: 'Build more housing',
			reasoning: `Population is at ${capacityPercent.toFixed(0)}% capacity (${population.current}/${population.capacity}). Immigration will stop soon without more housing.`,
			actionLabel: 'Build House',
			actionHref: '/game/build/house',
			estimatedTime: '5 minutes',
			impact: 'Medium'
		});
	}

	// CRITICAL: Low happiness
	if (population.happiness < 30) {
		suggestions.push({
			id: String(id++),
			priority: 'critical',
			category: 'population',
			title: 'Improve population happiness',
			reasoning: `Population happiness is critically low (${population.happiness}%). This will cause emigration and reduce productivity.`,
			actionLabel: 'View Population',
			actionHref: `/game/settlements/${settlementId}?focus=population`,
			estimatedTime: '10 minutes',
			impact: 'High'
		});
	}

	return suggestions;
}

/**
 * Analyze structures and generate suggestions
 */
function analyzeStructures(
	structures: SettlementStructure[],
	settlementId: string,
	startId: number
): Suggestion[] {
	const suggestions: Suggestion[] = [];
	let id = startId;

	// Find damaged structures
	const damagedStructures = structures.filter((s) => s.health < 50);
	const criticalStructures = structures.filter((s) => s.health < 20);

	// CRITICAL: Critically damaged structures
	if (criticalStructures.length > 0) {
		suggestions.push({
			id: String(id++),
			priority: 'critical',
			category: 'construction',
			title: 'Repair damaged structures',
			reasoning: `${criticalStructures.length} structure(s) are critically damaged (health < 20%). They will stop functioning soon if not repaired.`,
			actionLabel: 'View Structures',
			actionHref: `/game/settlements/${settlementId}?focus=structures`,
			estimatedTime: '5 minutes',
			impact: 'High'
		});
	} else if (damagedStructures.length > 0) {
		// MEDIUM: Damaged structures
		suggestions.push({
			id: String(id++),
			priority: 'medium',
			category: 'construction',
			title: 'Repair damaged structures',
			reasoning: `${damagedStructures.length} structure(s) are damaged (health < 50%). Repair them to restore full effectiveness.`,
			actionLabel: 'View Structures',
			actionHref: `/game/settlements/${settlementId}?focus=structures`,
			estimatedTime: '5 minutes',
			impact: 'Medium'
		});
	}

	// Find upgradeable structures
	const upgradeable = structures.filter((s) => s.level < s.maxLevel && s.health > 70);

	if (upgradeable.some((s) => s.category === 'EXTRACTOR')) {
		const extractorCount = upgradeable.filter((s) => s.category === 'EXTRACTOR').length;
		suggestions.push({
			id: String(id++),
			priority: 'medium',
			category: 'construction',
			title: 'Upgrade extractors',
			reasoning: `You have ${extractorCount} extractor(s) that can be upgraded to increase production.`,
			actionLabel: 'View Extractors',
			actionHref: `/game/settlements/${settlementId}?focus=structures`,
			estimatedTime: '15 minutes',
			impact: 'Medium'
		});
	}

	return suggestions;
}
