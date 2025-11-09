<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';
	import { Slider } from '@skeletonlabs/skeleton-svelte';
	import { generateMap } from '$lib/game/world-generator';

	import { Info } from 'lucide-svelte';
	import WorldMap from '$lib/components/shared/WorldMap.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let regions = $state<any[]>([]);

	// Simple, user-friendly controls
	let terrainRoughness = $state(50); // 0-100: Smooth to Rugged
	let mountainHeight = $state(50); // 0-100: Flat to Extreme Peaks
	let waterLevel = $state(50); // 0-100: Mostly Water to Mostly Land
	let climateVariation = $state(50); // 0-100: Uniform to Highly Varied

	// Advanced settings (hidden by default)
	let showAdvanced = $state(false);

	let elevationOptions = $state({
		scale: 1,
		octaves: 8,
		amplitude: 1,
		frequency: 0.05,
		persistence: 0.5
	});

	let precipitationOptions = $state({
		scale: 1,
		octaves: 8,
		amplitude: 1,
		frequency: 0.05,
		persistence: 0.5
	});

	let temperatureOptions = $state({
		scale: 1,
		octaves: 8,
		amplitude: 1,
		frequency: 0.05,
		persistence: 0.5
	});

	let mapOptions = $state({
		serverId: data.servers[0]?.id || '',
		worldName: '',
		width: 100,
		height: 100,
		elevationSeed: Date.now(),
		precipitationSeed: Date.now(),
		temperatureSeed: Date.now()
	});

	let isGenerating = $state(false);

	// Update technical parameters based on simple controls
	function updateParametersFromSimpleControls() {
		// Terrain Roughness affects octaves and frequency
		// More roughness = more octaves (detail) and higher frequency
		elevationOptions.octaves = Math.floor(4 + (terrainRoughness / 100) * 12); // 4-16
		elevationOptions.frequency = 0.01 + (terrainRoughness / 100) * 0.09; // 0.01-0.10

		// Mountain Height affects amplitude
		elevationOptions.amplitude = 0.5 + (mountainHeight / 100) * 4.5; // 0.5-5

		// Water Level affects elevation scale
		// Higher value = more land (shifts elevation up)
		elevationOptions.scale = 0.5 + (waterLevel / 100) * 1.5; // 0.5-2

		// Climate Variation affects precipitation and temperature complexity
		precipitationOptions.octaves = Math.floor(4 + (climateVariation / 100) * 12); // 4-16
		precipitationOptions.frequency = 0.01 + (climateVariation / 100) * 0.09; // 0.01-0.10
		precipitationOptions.amplitude = 0.5 + (climateVariation / 100) * 4.5; // 0.5-5
		precipitationOptions.scale = 1; // Keep constant for precipitation
		precipitationOptions.persistence = 0.5; // Keep constant
		
		temperatureOptions.octaves = Math.floor(4 + (climateVariation / 100) * 12); // 4-16
		temperatureOptions.frequency = 0.01 + (climateVariation / 100) * 0.09; // 0.01-0.10
		temperatureOptions.amplitude = 0.5 + (climateVariation / 100) * 4.5; // 0.5-5
		temperatureOptions.scale = 1; // Keep constant for temperature
		temperatureOptions.persistence = 0.5; // Keep constant
		
		// Keep persistence constant for elevation too
		elevationOptions.persistence = 0.5;

		console.log('Updated parameters from simple controls:', {
			terrainRoughness,
			mountainHeight,
			waterLevel,
			climateVariation,
			elevation: elevationOptions,
			precipitation: precipitationOptions,
			temperature: temperatureOptions
		});
	}

	async function generate() {
		isGenerating = true;
		
		try {
			// Update technical parameters from simple controls
			if (!showAdvanced) {
				updateParametersFromSimpleControls();
			}

			const generatedMap: any[][] = [];

			// Generate elevation map
			const elevationMap = await generateMap(
				{
					serverId: mapOptions.serverId,
					worldName: mapOptions.worldName,
					width: mapOptions.width,
					height: mapOptions.height,
					seed: mapOptions.elevationSeed
				},
				{
					octaves: elevationOptions.octaves,
					amplitude: elevationOptions.amplitude,
					frequency: elevationOptions.frequency,
					persistence: elevationOptions.persistence,
					scale: (x) => x * elevationOptions.scale
				}
			);

			// Generate precipitation map
			const precipitationMap = await generateMap(
				{
					serverId: mapOptions.serverId,
					worldName: mapOptions.worldName,
					width: mapOptions.width,
					height: mapOptions.height,
					seed: mapOptions.precipitationSeed
				},
				{
					octaves: precipitationOptions.octaves,
					amplitude: precipitationOptions.amplitude,
					frequency: precipitationOptions.frequency,
					persistence: precipitationOptions.persistence,
					scale: (x) => x * precipitationOptions.scale
				}
			);

			// Generate temperature map
			const temperatureMap = await generateMap(
				{
					serverId: mapOptions.serverId,
					worldName: mapOptions.worldName,
					width: mapOptions.width,
					height: mapOptions.height,
					seed: mapOptions.temperatureSeed
				},
				{
					octaves: temperatureOptions.octaves,
					amplitude: temperatureOptions.amplitude,
					frequency: temperatureOptions.frequency,
					persistence: temperatureOptions.persistence,
					scale: (x) => x * temperatureOptions.scale
				}
			);

			// Create regions from the generated maps
			for (let i = 0; i < elevationMap.length; i++) {
				generatedMap[i] = [];
				for (let j = 0; j < elevationMap[i].length; j++) {
					generatedMap[i][j] = {
						xCoord: i,
						yCoord: j,
						name: `${i}:${j}`,
						elevationMap: elevationMap[i][j],
						precipitationMap: precipitationMap[i][j],
						temperatureMap: temperatureMap[i][j]
					} as any;
				}
			}

			regions = generatedMap.flat(1);
		} finally {
			isGenerating = false;
		}
	}
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
					type="text"
					class="input"
					bind:value={mapOptions.worldName}
					required
				/>
			</label>
			<label for="server-id" class="label">
				<span>Server ID</span>
				<select class="select" bind:value={mapOptions.serverId}>
					{#each data.servers as server, i}
						<option value={server.id}> {server.name}</option>
					{/each}
				</select>
			</label>
		</div>

		<h2>World Settings</h2>
		
		{#if !showAdvanced}
			<!-- Simple Controls -->
			<div class="space-y-4">
				<div class="flex flex-col gap-2">
					<Slider
						step={1}
						min={0}
						max={100}
						value={[terrainRoughness]}
						onValueChange={(details) => {
							terrainRoughness = details.value[0];
						}}
					>
						<div class="flex items-center justify-between mb-2">
							<Slider.Label class="text-sm font-medium">Terrain Roughness</Slider.Label>
							<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
								{terrainRoughness < 25 ? 'Smooth' : terrainRoughness < 50 ? 'Rolling' : terrainRoughness < 75 ? 'Hilly' : 'Rugged'}
							</span>
						</div>
						<Slider.Control class="relative flex items-center w-full h-2">
							<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
								<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
							</Slider.Track>
							<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
								<Slider.HiddenInput />
							</Slider.Thumb>
						</Slider.Control>
					</Slider>
					<p class="text-xs text-surface-600 dark:text-surface-400">How varied the terrain is. Smooth creates gentle landscapes, while rugged creates complex terrain.</p>
				</div>

				<div class="flex flex-col gap-2">
					<Slider
						step={1}
						min={0}
						max={100}
						value={[mountainHeight]}
						onValueChange={(details) => {
							mountainHeight = details.value[0];
						}}
					>
						<div class="flex items-center justify-between mb-2">
							<Slider.Label class="text-sm font-medium">Mountain Height</Slider.Label>
							<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
								{mountainHeight < 25 ? 'Flat' : mountainHeight < 50 ? 'Low Hills' : mountainHeight < 75 ? 'High Hills' : 'Extreme Peaks'}
							</span>
						</div>
						<Slider.Control class="relative flex items-center w-full h-2">
							<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
								<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
							</Slider.Track>
							<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
								<Slider.HiddenInput />
							</Slider.Thumb>
						</Slider.Control>
					</Slider>
					<p class="text-xs text-surface-600 dark:text-surface-400">Maximum elevation of terrain features. Flat creates plains, while extreme peaks creates tall mountains.</p>
				</div>

				<div class="flex flex-col gap-2">
					<Slider
						step={1}
						min={0}
						max={100}
						value={[waterLevel]}
						onValueChange={(details) => {
							waterLevel = details.value[0];
						}}
					>
						<div class="flex items-center justify-between mb-2">
							<Slider.Label class="text-sm font-medium">Land vs Water</Slider.Label>
							<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
								{waterLevel < 25 ? 'Ocean World' : waterLevel < 50 ? 'Archipelago' : waterLevel < 75 ? 'Continents' : 'Mostly Land'}
							</span>
						</div>
						<Slider.Control class="relative flex items-center w-full h-2">
							<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
								<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
							</Slider.Track>
							<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
								<Slider.HiddenInput />
							</Slider.Thumb>
						</Slider.Control>
					</Slider>
					<p class="text-xs text-surface-600 dark:text-surface-400">Ratio of water to land. Lower values create more oceans and islands, higher values create large continents.</p>
				</div>

				<div class="flex flex-col gap-2">
					<Slider
						step={1}
						min={0}
						max={100}
						value={[climateVariation]}
						onValueChange={(details) => {
							climateVariation = details.value[0];
						}}
					>
						<div class="flex items-center justify-between mb-2">
							<Slider.Label class="text-sm font-medium">Climate Variation</Slider.Label>
							<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
								{climateVariation < 25 ? 'Uniform' : climateVariation < 50 ? 'Moderate' : climateVariation < 75 ? 'Diverse' : 'Extreme'}
							</span>
						</div>
						<Slider.Control class="relative flex items-center w-full h-2">
							<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
								<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
							</Slider.Track>
							<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
								<Slider.HiddenInput />
							</Slider.Thumb>
						</Slider.Control>
					</Slider>
					<p class="text-xs text-surface-600 dark:text-surface-400">How much temperature and precipitation vary across the world. Uniform creates similar biomes, extreme creates diverse climates.</p>
				</div>
			</div>
		{/if}

		<!-- Advanced Settings Toggle -->
		<button
			type="button"
			class="btn preset-tonal text-sm mt-4"
			onclick={() => showAdvanced = !showAdvanced}
		>
			{showAdvanced ? '← Simple Settings' : 'Advanced Settings →'}
		</button>

		{#if showAdvanced}
			<h2>Elevation</h2>
		<div class="flex space-x-3">
			<label for="elevation-seed" class="label">
				<span>Seed</span>
				<input
					type="number"
					class="input"
					bind:value={mapOptions.elevationSeed}
				/>
			</label>

			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={1}
					min={1}
					max={16}
					value={[elevationOptions.octaves]}
					onValueChange={(details) => {
						elevationOptions.octaves = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Octaves</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{elevationOptions.octaves}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>

			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.1}
					min={1}
					max={5}
					value={[elevationOptions.amplitude]}
					onValueChange={(details) => {
						elevationOptions.amplitude = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Amplitude</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{elevationOptions.amplitude}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>

			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[elevationOptions.frequency]}
					onValueChange={(details) => {
						elevationOptions.frequency = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Frequency</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{elevationOptions.frequency}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>

			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[elevationOptions.persistence]}
					onValueChange={(details) => {
						elevationOptions.persistence = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Persistence</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{elevationOptions.persistence}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
		</div>

		<h2>Precipitation</h2>
		<div class="flex space-x-3">
			<label for="precipitation-seed" class="label">
				<span>Seed</span>
				<input
					type="number"
					class="input"
					bind:value={mapOptions.precipitationSeed}
				/>
			</label>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[precipitationOptions.scale]}
					onValueChange={(details) => {
						precipitationOptions.scale = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Scale</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{precipitationOptions.scale}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={1}
					min={1}
					max={16}
					value={[precipitationOptions.octaves]}
					onValueChange={(details) => {
						precipitationOptions.octaves = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Octaves</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{precipitationOptions.octaves}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.1}
					min={1}
					max={5}
					value={[precipitationOptions.amplitude]}
					onValueChange={(details) => {
						precipitationOptions.amplitude = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Amplitude</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{precipitationOptions.amplitude}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[precipitationOptions.frequency]}
					onValueChange={(details) => {
						precipitationOptions.frequency = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Frequency</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{precipitationOptions.frequency}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[precipitationOptions.persistence]}
					onValueChange={(details) => {
						precipitationOptions.persistence = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Persistence</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{precipitationOptions.persistence}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
		</div>

		<h2>Temperature</h2>
		<div class="flex space-x-3">
			<label for="temperature-seed" class="label">
				<span>Seed</span>
				<input
					type="number"
					class="input"
					bind:value={mapOptions.temperatureSeed}
				/>
			</label>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[temperatureOptions.scale]}
					onValueChange={(details) => {
						temperatureOptions.scale = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Scale</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{temperatureOptions.scale}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={1}
					min={1}
					max={16}
					value={[temperatureOptions.octaves]}
					onValueChange={(details) => {
						temperatureOptions.octaves = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Octaves</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{temperatureOptions.octaves}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.1}
					min={1}
					max={5}
					value={[temperatureOptions.amplitude]}
					onValueChange={(details) => {
						temperatureOptions.amplitude = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Amplitude</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{temperatureOptions.amplitude}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[temperatureOptions.frequency]}
					onValueChange={(details) => {
						temperatureOptions.frequency = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Frequency</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{temperatureOptions.frequency}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2 min-w-40">
				<Slider
					step={0.01}
					min={0.01}
					max={1}
					value={[temperatureOptions.persistence]}
					onValueChange={(details) => {
						temperatureOptions.persistence = details.value[0];
					}}
				>
					<div class="flex items-center justify-between mb-2">
						<Slider.Label class="text-sm font-medium">Persistence</Slider.Label>
						<span class="text-sm rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-2">
							{temperatureOptions.persistence}
						</span>
					</div>
					<Slider.Control class="relative flex items-center w-full h-2">
						<Slider.Track class="relative w-full h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<Slider.Range class="absolute h-full bg-primary-500 rounded-full" />
						</Slider.Track>
						<Slider.Thumb index={0} class="block w-5 h-5 bg-primary-500 border-2 border-surface-50 dark:border-surface-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
		</div>
		{/if}

		<!-- Generate Preview Button (outside form) -->
		<div class="mt-4">
			<button
				type="button"
				class="btn preset-tonal-primary rounded-md"
				disabled={!mapOptions.worldName || isGenerating}
				onclick={generate}
			>
				{#if isGenerating}
					Generating...
				{:else}
					Generate Preview (Optional)
				{/if}
			</button>
			<p class="text-xs text-surface-600 dark:text-surface-400 mt-2">
				Preview generation is optional. The world will be generated on the server when you save.
			</p>
		</div>

		<!-- Save Form -->
		<form
			action="?/save"
			method="POST"
			class="mt-4"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type !== 'redirect') await invalidateAll();

					await applyAction(result);
				};
			}}
		>
			<input type="hidden" name="map-options" value={JSON.stringify(mapOptions)} />
			<input
				type="hidden"
				name="elevation-options"
				value={JSON.stringify(elevationOptions)}
			/>
			<input
				type="hidden"
				name="precipitation-options"
				value={JSON.stringify(precipitationOptions)}
			/>
			<input
				type="hidden"
				name="temperature-options"
				value={JSON.stringify(temperatureOptions)}
			/>
		
			{#if form?.invalid}
				<div class="alert bg-error-500/10 text-error-900 dark:text-error-50 w-11/12 mx-auto m-5">
					<div class="alert-message"><Info />{form?.message}</div>
				</div>
			{/if}
			
			<button
				type="submit"
				class="btn preset-filled-primary-500 rounded-md"
				disabled={!mapOptions.worldName}
			>
				Save World
			</button>
		</form>
	</div>

	{#if regions && regions.length > 0}
		<div class="card p-4 rounded-md">
			<h2 class="text-xl font-semibold mb-4">World Preview (Elevation)</h2>
			<p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
				This is a client-side preview. The actual world will be generated on the server when you save.
			</p>
			<WorldMap previewRegions={regions} mode="admin" showLegend={true} showStats={true} />
		</div>
	{/if}
</div>

