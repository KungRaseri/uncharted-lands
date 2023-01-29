<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import {
		createDataTableStore,
		dataTableHandler,
		tableInteraction,
		type DataTableModel
	} from '@skeletonlabs/skeleton';

	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import WebPlus from 'svelte-material-icons/WebPlus.svelte';
	import ServerPlus from 'svelte-material-icons/ServerPlus.svelte';
	import type { Server } from '@sveltejs/kit';

	export let data: PageData;
	export let form: ActionData;

	let serversTableStore = createDataTableStore(data.servers, {
		search: '',
		sort: '',
		pagination: {
			offset: 0,
			limit: 5,
			size: 0,
			amounts: [1, 2, 5, 10]
		}
	});

	serversTableStore.subscribe((model) => dataTableHandler(model));

	let isServerFormActive: Boolean = false;

	function toggleServerForm() {
		isServerFormActive = !isServerFormActive;
	}

	function closeServerForm() {
		isServerFormActive = !isServerFormActive;
	}

	$: serversTableStore.updateSource(data.servers);
</script>

<div class="m-5">
	<div class="my-3 h-8 flex">
		<span class="mr-5 text-slate-50"><h1>Servers</h1></span>
		{#if data.servers.length}
			<div class="p-2">
				<button class="text-slate-50 hover:text-slate-700" on:click={toggleServerForm}>
					<ServerPlus size={24} />
				</button>
				{#if isServerFormActive}
					<button class="text-red-500 hover:text-slate-700" on:click={closeServerForm}>
						<Close size={24} />
					</button>
				{/if}
			</div>
		{/if}
	</div>
	{#if !data.servers.length && !isServerFormActive}
		<div class="w-1/3">
			<button
				on:click={toggleServerForm}
				class="relative block w-full h-full p-8 rounded-lg border-2 border-dashed border-gray-300 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-transparent"
			>
				<div class="mx-auto w-min"><ServerPlus color="silver" size={48} width={48} /></div>
				<span class="mt-2 block text-sm font-medium text-slate-200">Create a new server</span>
			</button>
		</div>
	{/if}

	{#if isServerFormActive}
		<div transition:slide>
			<div class="w-1/2 m-3 p-5">
				<form
					action="?/create"
					method="POST"
					use:enhance={() => {
						return async ({ result }) => {
							invalidateAll();

							applyAction(result);
						};
					}}
				>
					<div>
						<label for="name">Name</label>
						<input
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							id="name"
							type="text"
							name="name"
							required
						/>

						<label for="hostname">Hostname</label>
						<input
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							id="Hostname"
							type="text"
							name="hostname"
							required
						/>

						<label for="port">Port</label>
						<input
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							id="port"
							type="text"
							name="port"
							required
						/>

						{#if form?.invalid}
							<div transition:slide>
								<div class="alert alert-error mx-5 mt-5">
									<div class="alert-message text-primary-50">
										<Information size={24} />
										<div class="grid grid-cols-1">Form information is invalid</div>
										{#if form?.length}
											Password must be 16 or more characters in length
										{/if}
										{#if form?.exists}
											Server with this information already exists
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
					<button class="w-full my-5 px-3 py-2 bg-primary-900 text-primary-50 rounded-md">
						Submit
					</button>
				</form>
			</div>
		</div>
	{/if}
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input bind:value={$serversTableStore.search} type="search" placeholder="Search..." />
			<a
				href="/admin/servers/create"
				class="btn btn-sm variant-soft-primary"
			>
				<span class="mx-1 px-0 py-3 text-primary-50"><ServerPlus /></span>
				<span class="mx-1 px-0 py-2 text-primary-50">Create</span>
			</a>
		</div>
		<table class="table table-hover" use:tableInteraction>
			<thead>
				<tr>
					<th>ID</th>
					<th>Name</th>
					<th>Hostname</th>
					<th>Port</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#if $serversTableStore}
					{#each $serversTableStore.filtered as server, index}
						<tr>
							<td>{server.id}</td>
							<td>{server.name}</td>
							<td>{server.hostname}</td>
							<td>{server.port}</td>
							<td>{server.status}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
