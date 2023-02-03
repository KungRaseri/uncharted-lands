<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { generate } from '$lib/game/world-generator';
	import type { ActionData, PageData } from './$types';
	import { RangeSlider } from '@skeletonlabs/skeleton';

	export let data: PageData;
	export let form: ActionData;

	let map: number[][] | undefined;

	let iterations: number = 16,
		scale: number = 0.01,
		xoffset: number = 0,
		yoffset: number = 0,
		width: number = 10,
		height: number = 10;

	let elevationSeed: number = new Date().getTime();
	let precipitationSeed: number = new Date().getTime();
	let temperatureSeed: number = new Date().getTime();

	async function generateMap() {
		map = await generate(
			width,
			height,
			elevationSeed,
			precipitationSeed,
			temperatureSeed,
			scale,
			iterations,
			xoffset,
			yoffset
		);
	}

	let isTileTooltipActive = false;

	$: map = data.map;
	$: console.log(data.map);
	$: width, height, scale, iterations, xoffset, yoffset;
</script>

<div class="w-full h-full p-5 space-y-1">
	<div class="card p-3 w-fit mx-auto rounded-md">
		<h2 class="">New World</h2>
		<form
			action="?/createWorld"
			method="POST"
			class=""
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
						on:change={async () => {
							await generateMap();
						}}
					/>
				</div>
				<div class="mx-1">
					<label for="precipitation-seed">Precipitation Seed</label>
					<input
						id="precipitation-seed"
						name="precipitation-seed"
						type="number"
						bind:value={precipitationSeed}
						on:change={async () => {
							await generateMap();
						}}
					/>
				</div>
				<div class="mx-1">
					<label for="temperature-seed">Temperature Seed</label>
					<input
						id="temperature-seed"
						name="temperature-seed"
						type="number"
						bind:value={temperatureSeed}
						on:change={async () => {
							await generateMap();
						}}
					/>
				</div>
			</div>
			<div class="flex mt-5">
				<div class="flex">
					<div class="mx-1">
						<RangeSlider
							id="scale"
							name="scale"
							label="scale"
							step={0.01}
							min={0.01}
							max={1}
							ticked
							bind:value={scale}
							on:change={async () => {
								await generateMap();
							}}
						>
							Scale <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">{scale}</span>
						</RangeSlider>
					</div>
					<div class="mx-1">
						<RangeSlider
							id="iterations"
							name="iterations"
							label="iterations"
							step={1}
							min={1}
							max={16}
							ticked
							bind:value={iterations}
							on:change={async () => {
								await generateMap();
							}}
						>
							Iterations <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
								{iterations}
							</span>
						</RangeSlider>
					</div>
					<div class="mx-1">
						<RangeSlider
							id="xoffset"
							name="xoffset"
							label="xoffset"
							step={1}
							min={1}
							max={100}
							ticked
							bind:value={xoffset}
							on:change={async () => {
								await generateMap();
							}}
						>
							x-offset <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
								{xoffset}
							</span>
						</RangeSlider>
					</div>
					<div class="mx-1">
						<RangeSlider
							id="yoffset"
							name="yoffset"
							label="yoffset"
							step={1}
							min={1}
							max={100}
							ticked
							bind:value={yoffset}
							on:change={async () => {
								await generateMap();
							}}
						>
							y-offset <span class="rounded-md bg-surface-backdrop-token py-0.5 px-1">
								{yoffset}
							</span>
						</RangeSlider>
					</div>
				</div>
			</div>
			<div class="flex mt-5">
				<div class="flex">
					<div class="mx-1">
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
					<div class="mx-1">
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
			</div>
			<button class="btn bg-primary-400-500-token rounded-md"> Save </button>
		</form>
		<button
			class="btn bg-primary-400-500-token rounded-md"
			on:click={async () => {
				await generateMap();
			}}
		>
			Generate
		</button>
	</div>

	{#if map}
		<div class="grid grid-cols-10 w-11/12 mx-auto">
			{#each map as chunk}
				{#each chunk as region}
					<div
						class="border-token py-10 text-center"
						style="background: rgb({region * 255}, {region * 255}, {region * 255})"
					>
						{region.toPrecision(6)}
					</div>
				{/each}
			{/each}
		</div>
	{/if}
</div>
