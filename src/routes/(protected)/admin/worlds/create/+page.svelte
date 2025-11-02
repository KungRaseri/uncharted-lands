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

			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Octaves</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{elevationOptions.octaves}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>

			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Amplitude</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{elevationOptions.amplitude}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>

			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Frequency</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{elevationOptions.frequency}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>

			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Persistence</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{elevationOptions.persistence}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
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
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Scale</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{precipitationOptions.scale}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Octaves</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{precipitationOptions.octaves}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Amplitude</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{precipitationOptions.amplitude}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Frequency</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{precipitationOptions.frequency}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Persistence</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{precipitationOptions.persistence}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
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
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Scale</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{temperatureOptions.scale}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Octaves</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{temperatureOptions.octaves}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Amplitude</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{temperatureOptions.amplitude}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Frequency</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{temperatureOptions.frequency}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Slider.Control>
				</Slider>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span>Persistence</span>
					<span class="rounded-md bg-surface-300 dark:bg-surface-600 py-0.5 px-1">
						{temperatureOptions.persistence}
					</span>
				</div>
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
					<Slider.Control>
						<Slider.Track>
							<Slider.Range />
						</Slider.Track>
						<Slider.Thumb index={0}>
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

