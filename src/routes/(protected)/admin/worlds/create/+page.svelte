<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';
	import { TileType, type Prisma, type Region, type Tile } from '@prisma/client';
	import { RangeSlider, Stepper, Step, ProgressRadial } from '@skeletonlabs/skeleton';
	import { determineBiome, generateMap, normalizeValue } from '$lib/game/world-generator';

	import Information from 'svelte-material-icons/Information.svelte';
	import WorldMapPreview from '$lib/components/admin/world/WorldMapPreview.svelte';
	import cuid from 'cuid';

	export let data: PageData;
	export let form: ActionData;

	const PREVIEW_STEP = 4;

	let regions: Prisma.RegionGetPayload<{
		include: { tiles: { include: { Biome: true } } };
	}>[];

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
		seed: Date.now()
	};

	let elevationSeed = Date.now();
	let precipitationSeed = Date.now() - 1;
	let temperatureSeed = Date.now() + 1;

	async function generate() {
		const generatedMap: Prisma.RegionGetPayload<{
			include: { tiles: { include: { Biome: true } } };
		}>[][] = [];

		const elevationMap = await generateMap(mapOptions, {
			octaves: elevationOptions.octaves,
			amplitude: elevationOptions.amplitude,
			frequency: elevationOptions.frequency,
			persistence: elevationOptions.persistence,
			scale(x) {
				return x * elevationOptions.scale;
			}
		});

		const precipitationMap = await generateMap(mapOptions, {
			octaves: precipitationOptions.octaves,
			amplitude: precipitationOptions.amplitude,
			frequency: precipitationOptions.frequency,
			persistence: precipitationOptions.persistence,
			scale(x) {
				return x * precipitationOptions.scale;
			}
		});

		const temperatureMap = await generateMap(mapOptions, {
			octaves: temperatureOptions.octaves,
			amplitude: temperatureOptions.amplitude,
			frequency: temperatureOptions.frequency,
			persistence: temperatureOptions.persistence,
			scale(x) {
				return x * temperatureOptions.scale;
			}
		});

		for (let chunk = 0; chunk < elevationMap.length; chunk++) {
			generatedMap[chunk] = [];
			for (let x = 0; x < elevationMap[chunk].length; x++) {
				const regionId = cuid();

				let tiles: Prisma.TileGetPayload<{
					include: { Biome: true };
				}>[] = [];

				for (let y = 0; y < elevationMap[chunk][x].length; y++) {
					for (let tile = 0; tile < elevationMap[chunk][x][y].length; tile++) {
						const biome = await determineBiome(
							data.biomes,
							normalizeValue(precipitationMap[chunk][x][y][tile], 0, 450),
							normalizeValue(temperatureMap[chunk][x][y][tile], -10, 32)
						);

						tiles.push({
							id: cuid(),
							regionId: regionId,
							type: elevationMap[chunk][x][y][tile] <= 0 ? TileType.OCEAN : TileType.LAND,
							elevation: elevationMap[chunk][x][y][tile],
							precipitation: precipitationMap[chunk][x][y][tile],
							temperature: temperatureMap[chunk][x][y][tile],
							biomeId: biome.id,
							Biome: biome
						} as Prisma.TileGetPayload<{
							include: { Biome: true };
						}>);
					}
				}

				generatedMap[chunk][x] = {
					id: regionId,
					worldId: '',
					xCoord: chunk,
					yCoord: x,
					name: `${chunk}:${x}`,
					elevationMap: elevationMap[chunk][x],
					precipitationMap: precipitationMap[chunk][x],
					temperatureMap: temperatureMap[chunk][x],
					tiles: tiles
				};
			}
		}

		regions = generatedMap.flat(1);
	}

	function onCompleteHandler(e: Event): void {
		console.log('event:complete', e);
	}

	function onNextHandler(e: Event): void {
		console.log('event:next', e);
	}

	function onStepHandler(e: Event): void {
		console.log('event:step', e);

		if (e.detail.state.current === PREVIEW_STEP) {
			const data = new FormData()
			console.log('PREVIEW');

		}
	}

	function onBackHandler(e: Event): void {
		console.log('event:back', e);
	}

	$: regions;
</script>

<div class="w-full h-full p-5 space-y-5">
	<div class="card p-3 rounded-md space-y-3">
		<h1 class="">New World</h1>
		<hr class="my-1" />
		<Stepper
			buttonNext="variant-ghost-primary"
			buttonComplete="variant-ghost-secondary"
			on:complete={onCompleteHandler}
			on:next={onNextHandler}
			on:step={onStepHandler}
			on:back={onBackHandler}
		>
			<Step locked={!mapOptions.worldName}>
				<svelte:fragment slot="header">
					<h2>General</h2>
				</svelte:fragment>
				<div class="flex flex-col space-y-3">
					<label for="world-name" class="label">
						<span>World Name</span>
						<input
							id="world-name"
							name="world-name"
							type="text"
							class="input"
							bind:value={mapOptions.worldName}
							required
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
				</div>
			</Step>
			<Step>
				<svelte:fragment slot="header">
					<h2>Elevation</h2>
				</svelte:fragment>
				<div class="flex flex-col space-y-3">
					<label for="elevation-seed" class="label">
						<span>Seed</span>
						<input
							id="elevation-seed"
							name="elevation-seed"
							type="number"
							class="input"
							bind:value={elevationSeed}
						/>
					</label>

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
					>
						<span> Persistence </span>
						<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{elevationOptions.persistence}
						</span>
					</RangeSlider>
				</div>
			</Step>
			<Step>
				<svelte:fragment slot="header">
					<h2>Precipitation</h2>
				</svelte:fragment>
				<div class="flex flex-col space-y-3">
					<label for="precipitation-seed" class="label">
						<span>Seed</span>
						<input
							id="precipitation-seed"
							name="precipitation-seed"
							type="number"
							class="input"
							bind:value={precipitationSeed}
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
					>
						<span>Persistence</span>
						<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{precipitationOptions.persistence}
						</span>
					</RangeSlider>
				</div>
			</Step>
			<Step>
				<svelte:fragment slot="header">
					<h2>Temperature</h2>
				</svelte:fragment>
				<div class="flex flex-col space-y-3">
					<label for="temperature-seed" class="label">
						<span>Seed</span>
						<input
							id="temperature-seed"
							name="temperature-seed"
							type="number"
							class="input"
							bind:value={temperatureSeed}
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
					>
						<span>Persistence</span>
						<span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
							{temperatureOptions.persistence}
						</span>
					</RangeSlider>
				</div>
			</Step>
			<Step>
				<svelte:fragment slot="header">
					<h2>Preview</h2>
				</svelte:fragment>
				<div class="flex flex-col space-y-3">
					{#if !regions}
						<div class="placeholder animate-pulse" />
					{:else}
						{#each regions as region}
							{#each region.tiles as tile}
								<div
									class="w-[1px] h-[1px]"
									style="background: rgb({1 + tile.elevation * 255}, {1 +
										tile.elevation * 255}, {1 + tile.elevation * 255})"
								/>
							{/each}
						{/each}
					{/if}
				</div>
			</Step>
		</Stepper>
		<!-- 


		

		
		<form
			action="?/preview"
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
				Preview
			</button>
		</form> -->
	</div>

	{#if regions}
		<WorldMapPreview {regions} />
	{/if}
</div>
