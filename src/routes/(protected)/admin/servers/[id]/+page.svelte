<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="m-0 p-0">
	<div class="rounded-md mx-1 my-5">
		<div class="px-6 py-2 w-full flex">
			<span class="text-xl">{data.server.name}</span>
			<span
				class="absolute right-0 py-0.5 px-2 mx-2 my-1 rounded-full text-xs font-medium 
				{data.server.status == 'ONLINE' ? 'bg-green-100  text-green-800' : 'bg-red-100  text-red-800'}"
			>
				{data.server.status}
			</span>
		</div>
		<div class="p-0 rounded-md mx-5 my-5">
			<div class="px-6 py-1 w-full">
				{#if !data.server.worlds.length}
					<p class="m-1">None</p>
				{/if}
				<div class="w-full flex p-0 m-0 overflow-x-scroll">
					{#each data.server.worlds as world, i}
						<a
							href="/admin/worlds/{world.id}"
							class="m-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{i}
						</a>
					{/each}
				</div>
			</div>
		</div>
		<div class="p-0 rounded-md mx-5 my-5">
			<div class="px-6 py-1 w-full">
				<hr class="!border-t-8 !border-double" />

				{#if !data.server.profileServerData.length}
					<p class="m-1">None</p>
				{/if}
				<div class="w-full flex p-0 m-0 overflow-x-scroll">
					{#each data.server.profileServerData as playerProfile, i}
						<a
							href="/admin/{playerProfile.profileId}"
							class="m-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{i}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
