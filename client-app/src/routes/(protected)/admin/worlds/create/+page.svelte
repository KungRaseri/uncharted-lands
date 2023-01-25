<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { generate } from '$lib/game/world-generator';
	import type { ActionData, PageData } from './$types';
	import { Canvas, Layer, t, type Render } from 'svelte-canvas';
	import { RangeSlider } from '@skeletonlabs/skeleton';

	export let data: PageData;
	export let form: ActionData;

	let map: number[][] | undefined;
	let mapCanvas;

	let iterations: number = 1,
		scale: number = 1,
		width: number = 100,
		height: number = 100;

	let elevationSeed: number = new Date().getTime();
	let precipitationSeed: number = new Date().getTime();
	let temperatureSeed: number = new Date().getTime();

	async function handleSettingsChange() {
		map = await generate(
			100,
			100,
			100,
			elevationSeed,
			precipitationSeed,
			temperatureSeed,
			scale / 1000,
			iterations
		);
	}

	let isTileTooltipActive = false;

	async function showTooltip() {
		isTileTooltipActive = true;
	}

	async function closeTooltip() {
		isTileTooltipActive = false;
	}
	let render: Render;

	$: map = data.map;
	$: iterations, scale, width, height;
	$: render = ({ context, width, height }) => {
		if (!map) return;

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				context.fillStyle = `rgb(${map[x][y] * 255},${map[x][y] * 255},${map[x][y] * 255})`;
				context.fillRect(x, y, 1, 1);
			}
		}
	};
</script>

<div class="mx-auto p-5 w-full h-full">
	<h1 class="">New World</h1>
	<div class="flex mx-auto p-5 my-5 bg-surface-700 rounded-md">
		<div class="w-1/2 h-full">
			<form
				action="?/createWorld"
				method="POST"
				class="bg-surface-600 p-5 mb-3 rounded-md"
				use:enhance={() => {
					return async ({ result }) => {
						invalidateAll();

						applyAction(result);
					};
				}}
			>
				<div class="flex">
					<div class="mx-1">
						<label for="elevation-seed">Elevation Seed</label>
						<input
							id="elevation-seed"
							name="elevation-seed"
							type="number"
							bind:value={elevationSeed}
							on:change={handleSettingsChange}
						/>
					</div>
					<div class="mx-1">
						<label for="precipitation-seed">Precipitation Seed</label>
						<input
							id="precipitation-seed"
							name="precipitation-seed"
							type="number"
							bind:value={precipitationSeed}
							on:change={handleSettingsChange}
						/>
					</div>
					<div class="mx-1">
						<label for="temperature-seed">Temperature Seed</label>
						<input
							id="temperature-seed"
							name="temperature-seed"
							type="number"
							bind:value={temperatureSeed}
							on:change={handleSettingsChange}
						/>
					</div>
				</div>
				<div class="flex mt-5">
					<!-- <div class="flex">
						<div class="mx-1">
							<label for="width">Width</label>
							<input
								id="width"
								name="width"
								type="range"
								min="1"
								max="100"
								bind:value={width}
								on:change={handleSettingsChange}
							/>
						</div>
						<div class="mx-1">
							<label for="height">Height</label>
							<input
								id="height"
								name="height"
								type="range"
								min="1"
								max="100"
								bind:value={height}
								on:change={handleSettingsChange}
							/>
						</div>
					</div> -->
					<div class="flex">
						<div class="mx-1">
							<RangeSlider
								id="iterations"
								name="iterations"
								label="iterations"
								step={1}
								min={1}
								max={8}
								ticked
								bind:value={iterations}
								on:change={handleSettingsChange}
							>
								Iterations <span class="rounded-md bg-slate-400 px-2">{iterations}</span>
							</RangeSlider>
						</div>
						<div class="mx-1">
							<RangeSlider
								id="scale"
								name="scale"
								label="scale"
								step={1}
								min={1}
								max={100}
								ticked
								bind:value={scale}
								on:change={handleSettingsChange}
							>
								Scale <span class="rounded-md bg-slate-400 px-2">{scale}</span>
							</RangeSlider>
						</div>
					</div>
				</div>
				<button class="mx-1 my-5 px-3 py-2 w-fit bg-primary-900 text-primary-50 rounded-md">
					Generate
				</button>
			</form>
		</div>
		{#if map}
			<div class="flex w-1/2 h-full bg-slate-900 mx-5">
				<Canvas width={100} height={100}>
					<Layer {render} />
				</Canvas>
				<canvas id="map" bind:this={mapCanvas} />
			</div>
		{/if}
	</div>
</div>
