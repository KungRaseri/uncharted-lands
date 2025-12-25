/**
 * Construction Store (Svelte 5)
 *
 * Manages construction queue state and real-time updates via Socket.IO.
 * Tracks active building projects and queued projects per settlement.
 */

import { browser } from '$app/environment';
import { socketStore } from './socket';
import { logger } from '$lib/utils/logger';

type BuildingType = 'HOUSING' | 'DEFENSE' | 'INFRASTRUCTURE' | 'PRODUCTION' | 'OTHER';

interface ResourceCost {
	wood: number;
	stone: number;
	ore?: number;
}

interface ConstructionProject {
	id: string;
	name: string;
	type: BuildingType;
	progress: number; // 0-100 percentage
	startTime: number; // Unix timestamp in milliseconds
	completionTime: number; // Unix timestamp in milliseconds
	resources: ResourceCost;
}

interface ConstructionState {
	active: ConstructionProject[];
	queued: ConstructionProject[];
}

interface ConstructionStore {
	construction: Map<string, ConstructionState>; // settlementId → ConstructionState
}

// Reactive state using Svelte 5 runes
let state = $state<ConstructionStore>({
	construction: new Map()
});

// Initialize Socket.IO listeners
function initializeListeners(): void {
	const socket = socketStore.getSocket();
	if (!socket) return;

	// Listen for construction started event (project begins building)
	socket.on(
		'construction-started',
		(data: { settlementId: string; constructionId: string; structureType: string; category?: string; completesAt: Date; isEmergency?: boolean; timestamp: number }) => {
			const currentState = state.construction.get(data.settlementId) || {
				active: [],
				queued: []
			};

			// Convert server data to ConstructionProject format
			const project: ConstructionProject = {
				id: data.constructionId,
				name: data.structureType,
				type: (data.category as BuildingType) || 'OTHER',
				progress: 0,
				startTime: data.timestamp,
				completionTime: new Date(data.completesAt).getTime(),
				resources: { wood: 0, stone: 0 }
			};

			// Add to active projects
			const updatedActive = [...currentState.active, project];

			// Remove from queued if it was there (by structure type since ID changes)
			const updatedQueued = currentState.queued.filter((p) => p.name !== data.structureType);

			state.construction.set(data.settlementId, {
				active: updatedActive,
				queued: updatedQueued
			});

			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	);

	// Listen for batched construction progress updates (optimized - one event per world per second)
	socket.on(
		'construction-progress-batch',
		(data: {
			worldId: string;
			timestamp: number;
			constructions: Array<{
				settlementId: string;
				projectId: string;
				progress: number;
				timeRemaining: number;
			}>;
		}) => {
			// Process all constructions in the batch
			for (const construction of data.constructions) {
				const currentState = state.construction.get(construction.settlementId);
				if (!currentState) continue;

				// Update progress in active projects
				const updatedActive = currentState.active.map((project) => {
					if (project.id === construction.projectId) {
						return {
							...project,
							progress: construction.progress,
							completionTime: Date.now() + construction.timeRemaining * 1000
						};
					}
					return project;
				});

				state.construction.set(construction.settlementId, {
					...currentState,
					active: updatedActive
				});
			}

			// Trigger reactivity once for all updates
			state.construction = new Map(state.construction);
		}
	);

	// Listen for construction completed event
	socket.on(
		'construction-complete',
		(data: { settlementId: string; structureId: string; structureType: string; constructionTime: number; timestamp: number }) => {
			const currentState = state.construction.get(data.settlementId);
			if (!currentState) return;

			// Remove from active projects by structure type (since completion event only has structureType)
			const updatedActive = currentState.active.filter((p) => p.name !== data.structureType);

			// If there are queued projects, move the first one to active
			let updatedQueued = [...currentState.queued];
			if (updatedQueued.length > 0 && updatedActive.length < 3) {
				// Auto-start next queued project (assuming max 3 simultaneous)
				const nextProject = updatedQueued.shift();
				if (nextProject) {
					// Server will send construction-started event for this
				}
			}

			state.construction.set(data.settlementId, {
				active: updatedActive,
				queued: updatedQueued
			});

			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	);

	// Listen for new project queued
	socket.on(
		'construction-queued',
		(data: { settlementId: string; constructionId: string; structureType: string; category?: string; position: number; status: string; completesAt?: Date; resourcesCost?: ResourceCost; timestamp: number }) => {
			const currentState = state.construction.get(data.settlementId) || {
				active: [],
				queued: []
			};

			// Convert server data to ConstructionProject format
			const project: ConstructionProject = {
				id: data.constructionId,
				name: data.structureType,
				type: (data.category as BuildingType) || 'OTHER',
				progress: 0,
				startTime: data.timestamp,
				completionTime: data.completesAt ? new Date(data.completesAt).getTime() : 0,
				resources: data.resourcesCost || { wood: 0, stone: 0 }
			};

			// Add to queued projects
			const updatedQueued = [...currentState.queued, project];

			state.construction.set(data.settlementId, {
				...currentState,
				queued: updatedQueued
			});

			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	);

	// Listen for project cancelled
	socket.on(
		'construction-cancelled',
		(data: { settlementId: string; projectId: string; refundResources?: ResourceCost }) => {
			const currentState = state.construction.get(data.settlementId);
			if (!currentState) return;

			// Remove from both active and queued
			const updatedActive = currentState.active.filter((p) => p.id !== data.projectId);
			const updatedQueued = currentState.queued.filter((p) => p.id !== data.projectId);

			state.construction.set(data.settlementId, {
				active: updatedActive,
				queued: updatedQueued
			});

			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	);

	// Listen for bulk construction state (e.g., on page load)
	socket.on(
		'construction-state',
		(data: {
			settlementId: string;
			active: ConstructionProject[];
			queued: ConstructionProject[];
		}) => {
			state.construction.set(data.settlementId, {
				active: data.active,
				queued: data.queued
			});

			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	);
}

// Progress ticker - update construction progress every second
let progressInterval: ReturnType<typeof setInterval> | null = null;

function startProgressTicker() {
	if (progressInterval) return; // Already running
	
	progressInterval = setInterval(() => {
		const now = Date.now();
		let hasChanges = false;
		
		// Update progress for all active constructions
		state.construction.forEach((constructionState, settlementId) => {
			if (constructionState.active.length > 0) {
				const updatedActive = constructionState.active.map((project) => {
					const totalTime = project.completionTime - project.startTime;
					const elapsed = now - project.startTime;
					const progress = Math.min(100, Math.max(0, Math.floor((elapsed / totalTime) * 100)));
					
					if (progress !== project.progress) {
						hasChanges = true;
						return { ...project, progress };
					}
					return project;
				});
				
				if (hasChanges) {
					state.construction.set(settlementId, {
						...constructionState,
						active: updatedActive
					});
				}
			}
		});
		
		if (hasChanges) {
			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	}, 1000); // Update every second
}

function stopProgressTicker() {
	if (progressInterval) {
		clearInterval(progressInterval);
		progressInterval = null;
	}
}

// Subscribe to socket connection state (only in browser)
if (browser) {
	socketStore.subscribe(($socket) => {
		if ($socket.connectionState === 'connected' && $socket.socket) {
			initializeListeners();
			startProgressTicker();

			// Request initial construction state for all settlements we have in the map
			if (state.construction.size === 0) {
				// Will be populated when settlement page loads and requests state
			}
		} else {
			stopProgressTicker();
		}
	});
}

// Exported API
export const constructionStore = {
	/**
	 * Get entire construction state for a settlement
	 */
	get state() {
		return state;
	},

	/**
	 * Get construction state for a specific settlement
	 */
	getConstructionState(settlementId: string): ConstructionState | undefined {
		return state.construction.get(settlementId);
	},

	/**
	 * Get all active projects for a settlement
	 */
	getActiveProjects(settlementId: string): ConstructionProject[] {
		return state.construction.get(settlementId)?.active || [];
	},

	/**
	 * Get all queued projects for a settlement
	 */
	getQueuedProjects(settlementId: string): ConstructionProject[] {
		return state.construction.get(settlementId)?.queued || [];
	},

	/**
	 * Get all projects (active + queued) for a settlement
	 */
	getAllProjects(settlementId: string): ConstructionProject[] {
		const constructionState = state.construction.get(settlementId);
		if (!constructionState) return [];
		return [...constructionState.active, ...constructionState.queued];
	},

	/**
	 * Get a specific project by ID
	 */
	getProjectById(settlementId: string, projectId: string): ConstructionProject | undefined {
		const allProjects = this.getAllProjects(settlementId);
		return allProjects.find((p) => p.id === projectId);
	},

	/**
	 * Get count of active projects
	 */
	getActiveCount(settlementId: string): number {
		return this.getActiveProjects(settlementId).length;
	},

	/**
	 * Get count of queued projects
	 */
	getQueuedCount(settlementId: string): number {
		return this.getQueuedProjects(settlementId).length;
	},

	/**
	 * Get total count of all projects
	 */
	getTotalCount(settlementId: string): number {
		return this.getAllProjects(settlementId).length;
	},

	/**
	 * Check if there are any active projects
	 */
	hasActiveProjects(settlementId: string): boolean {
		return this.getActiveCount(settlementId) > 0;
	},

	/**
	 * Check if construction queue is full (max 3 active + 10 queued)
	 */
	isQueueFull(settlementId: string): boolean {
		const total = this.getTotalCount(settlementId);
		return total >= 13; // 3 active + 10 queued
	},

	/**
	 * Fetch construction queue from API (for initial page load)
	 */
	async fetchConstructionQueue(settlementId: string): Promise<void> {
		if (!browser) return;

		try {
			const { PUBLIC_CLIENT_API_URL } = await import('$env/static/public');
			const response = await fetch(`${PUBLIC_CLIENT_API_URL}/structures/construction-queue/${settlementId}`, {
				credentials: 'include',
			});

			if (!response.ok) {
				logger.error('[ConstructionStore] Failed to fetch construction queue', {
					status: response.status,
					settlementId,
				});
				return;
			}

			const data = await response.json();
			
			if (data.success) {
				const now = Date.now();
				
				// Convert API data to ConstructionProject format
				const active: ConstructionProject[] = data.active.map((item: any) => {
					const startTime = item.startedAt ? new Date(item.startedAt).getTime() : now;
					const completionTime = item.completesAt ? new Date(item.completesAt).getTime() : 0;
					const totalTime = completionTime - startTime;
					const elapsed = now - startTime;
					const progress = totalTime > 0 ? Math.min(100, Math.max(0, Math.floor((elapsed / totalTime) * 100))) : 0;
					
					return {
						id: item.id,
						name: item.structureType,
						type: 'OTHER' as BuildingType,
						progress,
						startTime,
						completionTime,
						resources: item.resourcesCost || { wood: 0, stone: 0 },
					};
				});

				const queued: ConstructionProject[] = data.queued.map((item: any) => ({
					id: item.id,
					name: item.structureType,
					type: 'OTHER' as BuildingType,
					progress: 0,
					startTime: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
					completionTime: 0,
					resources: item.resourcesCost || { wood: 0, stone: 0 },
				}));

				state.construction.set(settlementId, { active, queued });
				state.construction = new Map(state.construction);

				logger.debug('[ConstructionStore] Construction queue loaded', {
					settlementId,
					activeCount: active.length,
					queuedCount: queued.length,
				});
			}
		} catch (error) {
			logger.error('[ConstructionStore] Error fetching construction queue', {
				error,
				settlementId,
			});
		}
	},

	/**
	 * Request construction state from server
	 */
	requestConstructionState(settlementId: string): void {
		const socket = socketStore.getSocket();
		if (socket) {
			socket.emit('request-construction-state', { settlementId });
		}
	},

	/**
	 * Cancel a construction project
	 */
	cancelProject(settlementId: string, projectId: string): void {
		const socket = socketStore.getSocket();
		if (socket) {
			socket.emit('cancel-construction', { settlementId, projectId });
		}
	},

	/**
	 * Start building a new structure (add to queue or start immediately)
	 */
	startConstruction(settlementId: string, structureType: string, resources: ResourceCost): void {
		const socket = socketStore.getSocket();
		if (socket) {
			socket.emit('start-construction', {
				settlementId,
				structureType,
				resources
			});
		}
	}
};
