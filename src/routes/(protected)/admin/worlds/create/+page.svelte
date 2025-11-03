<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';
	import { Slider } from '@skeletonlabs/skeleton-svelte';
	import type { Prisma } from '@prisma/client';
	import { generateMap } from '$lib/game/world-generator';

	import { Info } from 'lucide-svelte';
	import WorldMapPreview from '$lib/components/admin/WorldMapPreview.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let regions = $state<Prisma.RegionGetPayload<{
		include: { tiles: { include: { Biome: true; Plots: true } } };
	}>[]>([]);

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

	async function generate() {}
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
					onchange={async () => {
						await generate();
					}}
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

		<h2>Elevation</h2>
		<div class="flex space-x-3">
			<label for="elevation-seed" class="label">
				<span>Seed</span>
				<input
					type="number"
					class="input"
					bind:value={mapOptions.elevationSeed}
					onchange={async () => {
						await generate();
					}}
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
						generate();
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
						generate();
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
						generate();
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
						generate();
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
					onchange={async () => {
						await generate();
					}}
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
						generate();
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
						generate();
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
						generate();
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
						generate();
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
						generate();
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
					onchange={async () => {
						await generate();
					}}
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
						generate();
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
						generate();
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
						generate();
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
						generate();
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
						generate();
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

		<form
			action="?/save"
			method="POST"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type !== 'redirect') await invalidateAll();

					await applyAction(result);
				};
			}}
		>
			<input type="hidden" value={JSON.stringify(regions)} />
			<input type="hidden" value={JSON.stringify(mapOptions)} />
			<input
				type="hidden"
				value={JSON.stringify(elevationOptions)}
			/>
			<input
				type="hidden"
				value={JSON.stringify(precipitationOptions)}
			/>
			<input
				type="hidden"
				value={JSON.stringify(temperatureOptions)}
			/>
			{#if form?.invalid}
				<div class="alert bg-error-500/10 text-error-900 dark:text-error-50 w-11/12 mx-auto m-5">
					<div class="alert-message"><Info />{form?.message}</div>
				</div>
			{/if}
			<button class="btn preset-filled-primary-500 rounded-md" disabled={!mapOptions.worldName}>
				Save
			</button>
		</form>
	</div>

	{#if regions}
		<WorldMapPreview {regions} />
	{/if}
</div>

