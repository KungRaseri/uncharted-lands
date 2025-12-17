/**
 * World Store - Reactive state management for game world data
 *
 * Manages current world, regions, and provides actions for loading world data
 */

import { writable, derived } from 'svelte/store';
import { requestWorldData, requestRegionData } from '$lib/game/world-api';

export interface WorldInfo {
	id: string;
	name: string;
	serverId: string;
	elevationSettings: unknown;
	precipitationSettings: unknown;
	temperatureSettings: unknown;
	createdAt: Date;
	updatedAt: Date;
}

export interface RegionInfo {
	id: string;
	worldId: string;
	name: string;
	xCoord: number;
	yCoord: number;
	elevationMap: unknown;
	precipitationMap: unknown;
	temperatureMap: unknown;
}

export interface TileInfo {
	id: string;
	biomeId: string;
	regionId: string;
	elevation: number;
	temperature: number;
	precipitation: number;
	type: 'OCEAN' | 'LAND';
	plotSlots?: number; // Number of extractor slots (default 5)
}

export interface RegionWithTiles extends RegionInfo {
	tiles?: TileInfo[];
}

export interface WorldState {
	currentWorld: WorldInfo | null;
	regions: RegionInfo[];
	loadedRegions: Map<string, RegionWithTiles>;
	loading: boolean;
	error: string | null;
}

/**
 * Create the world store
 */
function createWorldStore() {
	const { subscribe, set, update } = writable<WorldState>({
		currentWorld: null,
		regions: [],
		loadedRegions: new Map(),
		loading: false,
		error: null
	});

	return {
		subscribe,

		/**
		 * Load world data from server
		 */
		async loadWorld(worldId: string, includeRegions: boolean = true): Promise<void> {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const response = await requestWorldData({ worldId, includeRegions });

				if (response.success && response.world) {
					update((state) => ({
						...state,
						currentWorld: response.world as unknown as WorldInfo,
						regions: (response.regions as unknown as RegionInfo[]) || [],
						loading: false,
						error: null
					}));
				} else {
					throw new Error(response.error || 'Failed to load world');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		/**
		 * Load detailed region data with tiles
		 */
		async loadRegion(regionId: string, includeTiles: boolean = true): Promise<RegionWithTiles> {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const response = await requestRegionData({ regionId, includeTiles });

				if (response.success && response.region) {
					const region = response.region as unknown as RegionWithTiles;
					const regionData: RegionWithTiles = {
						id: region.id,
						worldId: region.worldId,
						name: region.name,
						xCoord: region.xCoord,
						yCoord: region.yCoord,
						elevationMap: region.elevationMap,
						precipitationMap: region.precipitationMap,
						temperatureMap: region.temperatureMap,
						tiles: region.tiles
					};

					// Cache the loaded region
					update((state) => {
						const newLoadedRegions = new Map(state.loadedRegions);
						newLoadedRegions.set(regionId, regionData);
						return {
							...state,
							loadedRegions: newLoadedRegions,
							loading: false,
							error: null
						};
					});

					return regionData;
				} else {
					throw new Error(response.error || 'Failed to load region');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		/**
		 * Set world directly (useful after creation)
		 */
		setWorld(world: WorldInfo, regions?: RegionInfo[]): void {
			update((state) => ({
				...state,
				currentWorld: world,
				regions: regions || state.regions,
				error: null
			}));
		},

		/**
		 * Clear current world
		 */
		clearWorld(): void {
			set({
				currentWorld: null,
				regions: [],
				loadedRegions: new Map(),
				loading: false,
				error: null
			});
		},

		/**
		 * Set loading state
		 */
		setLoading(loading: boolean): void {
			update((state) => ({ ...state, loading }));
		},

		/**
		 * Set error
		 */
		setError(error: string | null): void {
			update((state) => ({ ...state, error }));
		},

		/**
		 * Get a cached region
		 */
		getRegion(regionId: string): RegionWithTiles | undefined {
			let region: RegionWithTiles | undefined;
			update((state) => {
				region = state.loadedRegions.get(regionId);
				return state;
			});
			return region;
		}
	};
}

export const worldStore = createWorldStore();

// Derived stores for convenience
export const currentWorld = derived(worldStore, ($world) => $world.currentWorld);

export const worldRegions = derived(worldStore, ($world) => $world.regions);

export const worldLoading = derived(worldStore, ($world) => $world.loading);

export const worldError = derived(worldStore, ($world) => $world.error);

export const hasWorld = derived(worldStore, ($world) => $world.currentWorld !== null);
