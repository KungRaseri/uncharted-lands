<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';
	import { RangeSlider } from '@skeletonlabs/skeleton';
	import type { Region } from '@prisma/client';
	import {
		generateElevation,
		generatePrecipitation,
		generateTemperature
	} from '$lib/game/world-generator';
	import Information from 'svelte-material-icons/Information.svelte';
	import World from '$lib/components/game/map/World.svelte';

	export let data: PageData;
	export let form: ActionData;

	let regions: Region[] | null = null;

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

	let mapOptions = {
		serverId: data.servers[0].id,
		worldName: '',
		width: 100,
		height: 100,
		elevationSeed: Date.now(),
		precipitationSeed: Date.now(),
		temperatureSeed: Date.now()
	};

	async function generateMap() {
		const generatedMap: Region[][] = [];

		const elevationMap = await generateElevation(
			{
				worldName: mapOptions.worldName,
				serverId: mapOptions.serverId,
				width: mapOptions.width,
				height: mapOptions.height,
				eSeed: mapOptions.elevationSeed,
				pSeed: mapOptions.precipitationSeed,
				tSeed: mapOptions.temperatureSeed
			},
			{
				scale: (x) => {
					return x * elevationOptions.scale;
				},
				octaves: elevationOptions.octaves,
				amplitude: elevationOptions.amplitude,
				persistence: elevationOptions.persistence,
				frequency: elevationOptions.frequency
			}
		);

		const precipitationMap = await generatePrecipitation(
			{
				worldName: mapOptions.worldName,
				serverId: mapOptions.serverId,
				width: mapOptions.width,
				height: mapOptions.height,
				eSeed: mapOptions.elevationSeed,
				pSeed: mapOptions.precipitationSeed,
				tSeed: mapOptions.temperatureSeed
			},
			{
				octaves: precipitationOptions.octaves,
				amplitude: precipitationOptions.amplitude,
				persistence: precipitationOptions.persistence,
				frequency: precipitationOptions.frequency
			}
		);

		const temperatureMap = await generateTemperature(
			{
				worldName: mapOptions.worldName,
				serverId: mapOptions.serverId,
				width: mapOptions.width,
				height: mapOptions.height,
				eSeed: mapOptions.elevationSeed,
				pSeed: mapOptions.precipitationSeed,
				tSeed: mapOptions.temperatureSeed
			},
			{
				octaves: temperatureOptions.octaves,
				amplitude: temperatureOptions.amplitude,
				persistence: temperatureOptions.persistence,
				frequency: temperatureOptions.frequency
			}
		);

		for (let i = 0; i < elevationMap.length; i++) {
			generatedMap[i] = [];
			for (let j = 0; j < elevationMap[i].length; j++) {
				generatedMap[i][j] = {
					id: '',
					worldId: '',
					xCoord: i,
					yCoord: j,
					name: `${i}:${j}`,
					elevationMap: elevationMap[i][j],
					precipitationMap: precipitationMap[i][j],
					temperatureMap: temperatureMap[i][j]
				};
			}
		}

		regions = generatedMap.flat(1);
	}

	$: regions;
</script>

<div class="w-full h-full p-5 space-y-5">
	<div class="card p-3 w-fit mx-auto rounded-md space-y-3">
		<h1 class="">New World</h1>
		<hr class="my-1" />
		<h2>General</h2>
		<div class="flex space-x-3">
			<label for="world-name" class="label">
				<span>World Name</span>
				<input
					id="world-name"
					name="world-name"
					type="text"
					class="input"
					bind:value={mapOptions.worldName}
					required
					on:change={async () => {
						await generateMap();
					}}
				/>
			</label>
			<label for="server-id" class="label">
				<span>Server ID</span>
				<select id="server-id" name="server-id" class="select" bind:value={mapOptions.serverId}>
					{#each data.servers as server, i}
						<option value={server.id}> {server.name}</option>
					{/each}
				</select>
			</label>
			<RangeSlider
				id="width"
				name="width"
				label="width"
				step={1}
				min={1}
				max={10}
				ticked
				accent="accent-primary-500"
				bind:value={mapOptions.width}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Width</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{mapOptions.width}
				</span>
			</RangeSlider>
			<RangeSlider
				id="height"
				name="height"
				label="height"
				step={1}
				min={1}
				max={10}
				ticked
				accent="accent-primary-500"
				bind:value={mapOptions.height}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Height</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{mapOptions.height}
				</span>
			</RangeSlider>
		</div>

		<h2>Elevation</h2>
		<div class="flex space-x-3">
			<label for="elevation-seed" class="label">
				<span>Seed</span>
				<input
					id="elevation-seed"
					name="elevation-seed"
					type="number"
					class="input"
					bind:value={mapOptions.elevationSeed}
					on:change={async () => {
						await generateMap();
					}}
				/>
			</label>
			<RangeSlider
				id="elevation-scale"
				name="elevation-scale"
				label="elevation-scale"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={elevationOptions.scale}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span> Scale </span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{elevationOptions.scale}
				</span>
			</RangeSlider>
			<RangeSlider
				id="elevation-octaves"
				name="elevation-octaves"
				label="elevation-octaves"
				step={1}
				min={1}
				max={16}
				ticked
				accent="accent-primary-500"
				bind:value={elevationOptions.octaves}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span> Octaves </span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{elevationOptions.octaves}
				</span>
			</RangeSlider>

			<RangeSlider
				id="elevations-amplitude"
				name="elevations-amplitude"
				label="elevations-amplitude"
				step={0.1}
				min={1}
				max={5}
				ticked
				accent="accent-primary-500"
				bind:value={elevationOptions.amplitude}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span> Amplitude </span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{elevationOptions.amplitude}
				</span>
			</RangeSlider>

			<RangeSlider
				id="elevation-frequency"
				name="elevation-frequency"
				label="elevation-frequency"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={elevationOptions.frequency}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span> Frequency </span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{elevationOptions.frequency}
				</span>
			</RangeSlider>

			<RangeSlider
				id="elevation-persistence"
				name="elevation-persistence"
				label="elevation-persistence"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={elevationOptions.persistence}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span> Persistence </span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{elevationOptions.persistence}
				</span>
			</RangeSlider>
		</div>

		<h2>Precipitation</h2>
		<div class="flex space-x-3">
			<label for="precipitation-seed" class="label">
				<span>Seed</span>
				<input
					id="precipitation-seed"
					name="precipitation-seed"
					type="number"
					class="input"
					bind:value={mapOptions.precipitationSeed}
					on:change={async () => {
						await generateMap();
					}}
				/>
			</label>
			<RangeSlider
				id="precipitation-scale"
				name="precipitation-scale"
				label="precipitation-scale"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={precipitationOptions.scale}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Scale</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{precipitationOptions.scale}
				</span>
			</RangeSlider>
			<RangeSlider
				id="precipitation-octaves"
				name="precipitation-octaves"
				label="precipitation-octaves"
				step={1}
				min={1}
				max={16}
				ticked
				accent="accent-primary-500"
				bind:value={precipitationOptions.octaves}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Octaves</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{precipitationOptions.octaves}
				</span>
			</RangeSlider>
			<RangeSlider
				id="precipitation-amplitude"
				name="precipitation-amplitude"
				label="precipitation-amplitude"
				step={0.1}
				min={1}
				max={5}
				ticked
				accent="accent-primary-500"
				bind:value={precipitationOptions.amplitude}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Amplitude</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{precipitationOptions.amplitude}
				</span>
			</RangeSlider>
			<RangeSlider
				id="precipitation-frequency"
				name="precipitation-frequency"
				label="precipitation-frequency"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={precipitationOptions.frequency}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Frequency</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{precipitationOptions.frequency}
				</span>
			</RangeSlider>
			<RangeSlider
				id="precipitation-persistence"
				name="precipitation-persistence"
				label="precipitation-persistence"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={precipitationOptions.persistence}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Persistence</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{precipitationOptions.persistence}
				</span>
			</RangeSlider>
		</div>

		<h2>Temperature</h2>
		<div class="flex space-x-3">
			<label for="temperature-seed" class="label">
				<span>Seed</span>
				<input
					id="temperature-seed"
					name="temperature-seed"
					type="number"
					class="input"
					bind:value={mapOptions.temperatureSeed}
					on:change={async () => {
						await generateMap();
					}}
				/>
			</label>
			<RangeSlider
				id="temperature-scale"
				name="temperature-scale"
				label="temperature-scale"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={temperatureOptions.scale}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Scale</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{temperatureOptions.scale}
				</span>
			</RangeSlider>
			<RangeSlider
				id="temperature-octaves"
				name="temperature-octaves"
				label="temperature-octaves"
				step={1}
				min={1}
				max={16}
				ticked
				accent="accent-primary-500"
				bind:value={temperatureOptions.octaves}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Octaves</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{temperatureOptions.octaves}
				</span>
			</RangeSlider>
			<RangeSlider
				id="temperature-amplitude"
				name="temperature-amplitude"
				label="temperature-amplitude"
				step={0.1}
				min={1}
				max={5}
				ticked
				accent="accent-primary-500"
				bind:value={temperatureOptions.amplitude}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Amplitude</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{temperatureOptions.amplitude}
				</span>
			</RangeSlider>
			<RangeSlider
				id="temperature-frequency"
				name="temperature-frequency"
				label="temperature-frequency"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={temperatureOptions.frequency}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Frequency</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{temperatureOptions.frequency}
				</span>
			</RangeSlider>
			<RangeSlider
				id="temperature-persistence"
				name="temperature-persistence"
				label="temperature-persistence"
				step={0.01}
				min={0.01}
				max={1}
				ticked
				accent="accent-primary-500"
				bind:value={temperatureOptions.persistence}
				on:change={async () => {
					await generateMap();
				}}
			>
				<span>Persistence</span>
				<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
					{temperatureOptions.persistence}
				</span>
			</RangeSlider>
		</div>

		<form
			action="?/saveWorld"
			method="POST"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type !== 'redirect') await invalidateAll();

					await applyAction(result);
				};
			}}
		>
			<input type="hidden" name="map" id="map" value={JSON.stringify(regions)} />
			<input type="hidden" name="map-options" id="map-options" value={JSON.stringify(mapOptions)} />
			<input
				type="hidden"
				name="elevation-options"
				id="elevation-options"
				value={JSON.stringify(elevationOptions)}
			/>
			<input
				type="hidden"
				name="precipitation-options"
				id="precipitation-options"
				value={JSON.stringify(precipitationOptions)}
			/>
			<input
				type="hidden"
				name="temperature-options"
				id="temperature-options"
				value={JSON.stringify(temperatureOptions)}
			/>
			{#if form?.invalid}
				<div class="alert variant-ghost-error w-11/12 mx-auto m-5">
					<div class="alert-message"><Information />{form?.message}</div>
				</div>
			{/if}
			<button class="btn bg-primary-400-500-token rounded-md" disabled={!mapOptions.worldName}>
				Save
			</button>
		</form>
	</div>

	{#if regions}
		<World {regions} />
	{/if}
</div>
