/**
 * Settlement Network Map Component
 * ARTIFACT-05 Option 1: Settlement Network Map
 *
 * Visual map showing all player settlements + active transfers between them
 * - Canvas rendering for performance
 * - Animated lines for active transfers
 * - Settlement dots with hover tooltips
 * - Auto-updates via Socket.IO when transfers complete
 */

<script lang="ts">
	import { onMount } from 'svelte';
	import { transferStore } from '$lib/stores/game/transfers.svelte';
	import { Package, MapPin } from 'lucide-svelte';
	
	interface Settlement {
		id: string;
		name: string;
		x: number;
		y: number;
	}
	
	interface Props {
		settlements: Settlement[];
		worldId: string;
	}
	
	let { settlements, worldId }: Props = $props();
	
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let hoveredSettlement: Settlement | null = $state(null);
	let mousePos = $state({ x: 0, y: 0 });
	
	// Canvas dimensions
	const CANVAS_WIDTH = 800;
	const CANVAS_HEIGHT = 600;
	const SETTLEMENT_RADIUS = 8;
	const PADDING = 50;
	
	// Get active transfers from store
	let activeTransfers = $derived(transferStore.activeTransfers);
	
	// Calculate settlement positions on canvas
	function calculateCanvasPosition(settlement: Settlement): { x: number; y: number } {
		// Find bounds of all settlements
		const xCoords = settlements.map(s => s.x);
		const yCoords = settlements.map(s => s.y);
		const minX = Math.min(...xCoords);
		const maxX = Math.max(...xCoords);
		const minY = Math.min(...yCoords);
		const maxY = Math.max(...yCoords);
		
		// Normalize to canvas coordinates
		const xRange = maxX - minX || 1;
		const yRange = maxY - minY || 1;
		
		const canvasX = PADDING + ((settlement.x - minX) / xRange) * (CANVAS_WIDTH - 2 * PADDING);
		const canvasY = PADDING + ((settlement.y - minY) / yRange) * (CANVAS_HEIGHT - 2 * PADDING);
		
		return { x: canvasX, y: canvasY };
	}
	
	// Draw the network map
	function drawMap() {
		if (!ctx) return;
		
		// Clear canvas
		ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		
		// Draw active transfer lines
		activeTransfers.forEach(transfer => {
			const fromSettlement = settlements.find(s => s.id === transfer.fromSettlementId);
			const toSettlement = settlements.find(s => s.id === transfer.toSettlementId);
			
			if (fromSettlement && toSettlement) {
				const fromPos = calculateCanvasPosition(fromSettlement);
				const toPos = calculateCanvasPosition(toSettlement);
				
				// Animated dashed line
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 5]);
				ctx.lineDashOffset = -Date.now() / 50;
				
				ctx.beginPath();
				ctx.moveTo(fromPos.x, fromPos.y);
				ctx.lineTo(toPos.x, toPos.y);
				ctx.stroke();
				
				// Draw arrow at midpoint
				const midX = (fromPos.x + toPos.x) / 2;
				const midY = (fromPos.y + toPos.y) / 2;
				const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
				
				ctx.save();
				ctx.translate(midX, midY);
				ctx.rotate(angle);
				ctx.fillStyle = '#3b82f6';
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(-10, -5);
				ctx.lineTo(-10, 5);
				ctx.closePath();
				ctx.fill();
				ctx.restore();
			}
		});
		
		// Reset line dash
		ctx.setLineDash([]);
		
		// Draw settlement nodes
		settlements.forEach(settlement => {
			const pos = calculateCanvasPosition(settlement);
			const isHovered = hoveredSettlement?.id === settlement.id;
			
			// Draw circle
			ctx.fillStyle = isHovered ? '#10b981' : '#6366f1';
			ctx.strokeStyle = isHovered ? '#065f46' : '#4338ca';
			ctx.lineWidth = 2;
			
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, SETTLEMENT_RADIUS, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			
			// Draw settlement name (if hovered)
			if (isHovered) {
				ctx.fillStyle = '#1f2937';
				ctx.font = 'bold 12px sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText(settlement.name, pos.x, pos.y - SETTLEMENT_RADIUS - 5);
			}
		});
	}
	
	// Handle mouse move for hover detection
	function handleMouseMove(event: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		mousePos = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
		
		// Check if hovering over a settlement
		let newHovered: Settlement | null = null;
		for (const settlement of settlements) {
			const pos = calculateCanvasPosition(settlement);
			const distance = Math.sqrt(
				Math.pow(mousePos.x - pos.x, 2) + 
				Math.pow(mousePos.y - pos.y, 2)
			);
			
			if (distance <= SETTLEMENT_RADIUS + 2) {
				newHovered = settlement;
				break;
			}
		}
		
		hoveredSettlement = newHovered;
		canvas.style.cursor = newHovered ? 'pointer' : 'default';
	}
	
	// Animation loop
	let animationFrame: number;
	function animate() {
		drawMap();
		animationFrame = requestAnimationFrame(animate);
	}
	
	onMount(() => {
		ctx = canvas.getContext('2d');
		if (ctx) {
			animate();
		}
		
		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	});
</script>

<div class="card preset-filled-surface-50-900 p-4">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<MapPin size={24} class="text-primary-500" />
			<h3 class="text-lg font-bold">Settlement Network</h3>
		</div>
		<div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
			<Package size={16} />
			<span>{activeTransfers.length} active transfer{activeTransfers.length !== 1 ? 's' : ''}</span>
		</div>
	</div>
	
	<!-- Canvas -->
	<div class="relative rounded-lg overflow-hidden border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900">
		<canvas 
			bind:this={canvas}
			width={CANVAS_WIDTH}
			height={CANVAS_HEIGHT}
			onmousemove={handleMouseMove}
			class="w-full"
		/>
		
		<!-- Legend -->
		<div class="absolute bottom-4 left-4 bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs">
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-indigo-500 border-2 border-indigo-700"></div>
				<span>Settlement</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-6 h-0.5 bg-blue-500" style="border-top: 2px dashed #3b82f6"></div>
				<span>Active Transfer</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-700"></div>
				<span>Hovered</span>
			</div>
		</div>
		
		<!-- Hover tooltip -->
		{#if hoveredSettlement}
			<div 
				class="absolute pointer-events-none bg-surface-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg"
				style="left: {mousePos.x + 10}px; top: {mousePos.y - 40}px;"
			>
				<p class="font-bold">{hoveredSettlement.name}</p>
				<p class="text-xs text-surface-300">Position: ({hoveredSettlement.x}, {hoveredSettlement.y})</p>
			</div>
		{/if}
	</div>
	
	<!-- Stats -->
	<div class="grid grid-cols-3 gap-4 mt-4 text-center">
		<div>
			<p class="text-2xl font-bold text-primary-500">{settlements.length}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400">Settlements</p>
		</div>
		<div>
			<p class="text-2xl font-bold text-blue-500">{activeTransfers.length}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400">In Transit</p>
		</div>
		<div>
			<p class="text-2xl font-bold text-emerald-500">{transferStore.completedTransfers.length}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400">Completed</p>
		</div>
	</div>
</div>

<style>
	canvas {
		max-width: 100%;
		height: auto;
	}
</style>
