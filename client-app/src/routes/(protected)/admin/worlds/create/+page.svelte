<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { generate } from '$lib/game/world-generator';
	import type { ActionData, PageData } from './$types';
	import { RangeSlider } from '@skeletonlabs/skeleton';
	import type { Options } from 'fractal-noise';
	import type { Region } from '@prisma/client';

	export let data: PageData;
	export let form: ActionData;

	let map: Region[][] = [[]];

	let elevationOptions = {
		scale: 1,
		octaves: 8,
		amplitude: 1,
		frequency: 0.05,
		persistence: 0.5
	};

	let precipitationOptions = {
		scale: 1,
		octaves: 8,
		amplitude: 1,
		frequency: 0.05,
		persistence: 0.5
	};

	let temperatureOptions = {
		scale: 1,
		octaves: 8,
		amplitude: 1,
		frequency: 0.05,
		persistence: 0.5
	};

	let width: number = 100,
		height: number = 100;

	let elevationSeed: number = new Date().getTime();
	let precipitationSeed: number = new Date().getTime();
	let temperatureSeed: number = new Date().getTime();

	async function generateMap() {
		invalidateAll();
	}

	let isTileTooltipActive = false;

	$: map = data.map;
	$: width, height;
</script>

<div class="w-full h-full p-5 space-y-5">
	<div class="card p-3 w-fit mx-auto rounded-md">
		<h2 class="">New World</h2>
		<form
			action="?/saveWorld"
			method="POST"
			class="space-y-3"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'failure') invalidateAll();

					applyAction(result);
				};
			}}
		>
			<h2>General</h2>
			<div class="flex space-x-3">
				<label for="server-id" class="input-label">
					<span>Server ID</span>
					<select id="server-id" name="server-id">
						{#each data.servers as server}
							<option value={server.id}> {server.name}</option>
						{/each}
					</select>
				</label>
				<div class="">
					<RangeSlider
						id="width"
						name="width"
						label="width"
						step={1}
						min={1}
						max={10}
						ticked
						bind:value={width}
						on:change={async () => {
							await generateMap();
						}}
					>
						Width <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">{width}</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="height"
						name="height"
						label="height"
						step={1}
						min={1}
						max={10}
						ticked
						bind:value={height}
						on:change={async () => {
							await generateMap();
						}}
					>
						Height <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">{height}</span>
					</RangeSlider>
				</div>
			</div>

			<h2>Elevation</h2>
			<div class="flex space-x-3">
				<label for="elevation-seed" class="input-label">
					<span>Seed</span>
					<input
						id="elevation-seed"
						name="elevation-seed"
						type="number"
						bind:value={elevationSeed}
						on:change={async () => {
							await generateMap();
						}}
					/>
				</label>
				<div class="">
					<RangeSlider
						id="elevation-scale"
						name="elevation-scale"
						label="elevation-scale"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={elevationOptions.scale}
						on:change={async () => {
							await generateMap();
						}}
					>
						Scale <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{elevationOptions.scale}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="elevation-octaves"
						name="elevation-octaves"
						label="elevation-octaves"
						step={1}
						min={1}
						max={16}
						ticked
						bind:value={elevationOptions.octaves}
						on:change={async () => {
							await generateMap();
						}}
					>
						Octaves <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{elevationOptions.octaves}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="elevations-amplitude"
						name="elevations-amplitude"
						label="elevations-amplitude"
						step={0.1}
						min={1}
						max={5}
						ticked
						bind:value={elevationOptions.amplitude}
						on:change={async () => {
							await generateMap();
						}}
					>
						Amplitude <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{elevationOptions.amplitude}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="elevation-frequency"
						name="elevation-frequency"
						label="elevation-frequency"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={elevationOptions.frequency}
						on:change={async () => {
							await generateMap();
						}}
					>
						Frequency <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{elevationOptions.frequency}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="elevation-persistence"
						name="elevation-persistence"
						label="elevation-persistence"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={elevationOptions.persistence}
						on:change={async () => {
							await generateMap();
						}}
					>
						Persistence <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{elevationOptions.persistence}
						</span>
					</RangeSlider>
				</div>
			</div>

			<h2>Precipitation</h2>
			<div class="flex space-x-3">
				<label for="precipitation-seed" class="input-label">
					<span>Seed</span>
					<input
						id="precipitation-seed"
						name="precipitation-seed"
						type="number"
						bind:value={precipitationSeed}
						on:change={async () => {
							await generateMap();
						}}
					/>
				</label>
				<div class="">
					<RangeSlider
						id="precipitation-scale"
						name="precipitation-scale"
						label="precipitation-scale"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={precipitationOptions.scale}
						on:change={async () => {
							await generateMap();
						}}
					>
						Scale <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1"
							>{precipitationOptions.scale}</span
						>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="precipitation-octaves"
						name="precipitation-octaves"
						label="precipitation-octaves"
						step={1}
						min={1}
						max={16}
						ticked
						bind:value={precipitationOptions.octaves}
						on:change={async () => {
							await generateMap();
						}}
					>
						Octaves <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{precipitationOptions.octaves}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="precipitation-amplitude"
						name="precipitation-amplitude"
						label="precipitation-amplitude"
						step={0.1}
						min={1}
						max={5}
						ticked
						bind:value={precipitationOptions.amplitude}
						on:change={async () => {
							await generateMap();
						}}
					>
						Amplitude <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{precipitationOptions.amplitude}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="precipitation-frequency"
						name="precipitation-frequency"
						label="precipitation-frequency"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={precipitationOptions.frequency}
						on:change={async () => {
							await generateMap();
						}}
					>
						Frequency <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{precipitationOptions.frequency}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="precipitation-persistence"
						name="precipitation-persistence"
						label="precipitation-persistence"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={precipitationOptions.persistence}
						on:change={async () => {
							await generateMap();
						}}
					>
						Persistence <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{precipitationOptions.persistence}
						</span>
					</RangeSlider>
				</div>
			</div>

			<h2>Temperature</h2>
			<div class="flex space-x-3">
				<label for="temperature-seed" class="input-label">
					<span>Seed</span>
					<input
						id="temperature-seed"
						name="temperature-seed"
						type="number"
						bind:value={temperatureSeed}
						on:change={async () => {
							await generateMap();
						}}
					/>
				</label>
				<div class="">
					<RangeSlider
						id="temperature-scale"
						name="temperature-scale"
						label="temperature-scale"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={temperatureOptions.scale}
						on:change={async () => {
							await generateMap();
						}}
					>
						Scale <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1"
							>{temperatureOptions.scale}</span
						>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="temperature-octaves"
						name="temperature-octaves"
						label="temperature-octaves"
						step={1}
						min={1}
						max={16}
						ticked
						bind:value={temperatureOptions.octaves}
						on:change={async () => {
							await generateMap();
						}}
					>
						Octaves <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{temperatureOptions.octaves}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="temperature-amplitude"
						name="temperature-amplitude"
						label="temperature-amplitude"
						step={0.1}
						min={1}
						max={5}
						ticked
						bind:value={temperatureOptions.amplitude}
						on:change={async () => {
							await generateMap();
						}}
					>
						Amplitude <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{temperatureOptions.amplitude}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="temperature-frequency"
						name="temperature-frequency"
						label="temperature-frequency"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={temperatureOptions.frequency}
						on:change={async () => {
							await generateMap();
						}}
					>
						Frequency <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{temperatureOptions.frequency}
						</span>
					</RangeSlider>
				</div>
				<div class="">
					<RangeSlider
						id="temperature-persistence"
						name="temperature-persistence"
						label="temperature-persistence"
						step={0.01}
						min={0.01}
						max={1}
						ticked
						bind:value={temperatureOptions.persistence}
						on:change={async () => {
							await generateMap();
						}}
					>
						Persistence <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{temperatureOptions.persistence}
						</span>
					</RangeSlider>
				</div>
			</div>

			<input type="hidden" name="map" id="map" value={JSON.stringify(map)} />
			<button class="btn bg-primary-400-500-token rounded-md"> Save </button>
		</form>
	</div>

	{#if map}
		<div class="grid grid-cols-10 w-full border-token p-0.5">
			{#each map as regions, i}
				{#each regions as region, j}
					<div class="grid grid-cols-10 p-0.5 m-0 border-token border-yellow-500">
						{#each region.elevationMap as elevation, k}
							<div
								class="px-1 py-0 border-token border-neutral-500 justify-center text-center items-center"
								style="background: rgb({elevation * 255}, {elevation * 255}, {elevation * 255})"
							>
								{k}
							</div>
						{/each}
					</div>
				{/each}
			{/each}
		</div>
	{/if}
</div>
