/**
 * Construction Store (Svelte 5)
 *
 * Manages construction queue state and real-time updates via Socket.IO.
 * Tracks active building projects and queued projects per settlement.
 */

import { browser } from '$app/environment';
import { socketStore } from './socket';

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
		(data: { settlementId: string; project: ConstructionProject }) => {
			const currentState = state.construction.get(data.settlementId) || {
				active: [],
				queued: []
			};

			// Add to active projects
			const updatedActive = [...currentState.active, data.project];

			// Remove from queued if it was there
			const updatedQueued = currentState.queued.filter((p) => p.id !== data.project.id);

			state.construction.set(data.settlementId, {
				active: updatedActive,
				queued: updatedQueued
			});

			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	);

	// Listen for construction progress updates
	socket.on(
		'construction-progress',
		(data: {
			settlementId: string;
			projectId: string;
			progress: number;
			timeRemaining?: number;
		}) => {
			const currentState = state.construction.get(data.settlementId);
			if (!currentState) return;

			// Update progress in active projects
			const updatedActive = currentState.active.map((project) => {
				if (project.id === data.projectId) {
					return {
						...project,
						progress: data.progress,
						...(data.timeRemaining !== undefined && {
							completionTime: Date.now() + data.timeRemaining * 1000
						})
					};
				}
				return project;
			});

			state.construction.set(data.settlementId, {
				...currentState,
				active: updatedActive
			});

			// Trigger reactivity
			state.construction = new Map(state.construction);
		}
	);

	// Listen for construction completed event
	socket.on(
		'construction-completed',
		(data: { settlementId: string; projectId: string; structureId?: string }) => {
			const currentState = state.construction.get(data.settlementId);
			if (!currentState) return;

			// Remove from active projects
			const updatedActive = currentState.active.filter((p) => p.id !== data.projectId);

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
		(data: { settlementId: string; project: ConstructionProject }) => {
			const currentState = state.construction.get(data.settlementId) || {
				active: [],
				queued: []
			};

			// Add to queued projects
			const updatedQueued = [...currentState.queued, data.project];

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

// Subscribe to socket connection state (only in browser)
if (browser) {
	socketStore.subscribe(($socket) => {
		if ($socket.connectionState === 'connected' && $socket.socket) {
			initializeListeners();

			// Request initial construction state for all settlements we have in the map
			if (state.construction.size === 0) {
				// Will be populated when settlement page loads and requests state
			}
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
