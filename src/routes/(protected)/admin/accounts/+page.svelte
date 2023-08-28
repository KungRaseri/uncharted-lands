<script lang="ts">
	import type { PageData } from './$types';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';

	import AccountPlus from 'svelte-material-icons/AccountPlus.svelte';
	import Account from 'svelte-material-icons/Account.svelte';

	export let data: PageData;

	let tableSimple: TableSource;

	if (data.accounts.length) {
		const filteredKeys = Object.keys(data.accounts[0]).filter(
			(key) => key !== 'worlds' && key !== 'players' && key !== 'profile'
		);
		tableSimple = {
			head: filteredKeys,
			body: tableMapperValues(data.accounts, filteredKeys),
			meta: tableMapperValues(data.accounts, filteredKeys),
			foot: ['Total Servers', data.accounts.length.toString()]
		};
	}

	function selectionHandler(e: any) {}
</script>

<div class="grid grid-cols-2 p-4">
	<h1>Accounts</h1>
</div>
<hr class="mx-2" />
<section class="p-4">
	{#if data.accounts.length}
		<Table source={tableSimple} interactive={true} on:selected={selectionHandler} />
	{:else}
		<div class="justify-center items-center text-center">
			<div class="mx-auto w-min">
				<Account size={48} />
			</div>
			<h3 class="mt-2 text-sm font-semibold text-token">No servers</h3>
			<p class="mt-1 text-sm text-surface-500-400-token">Get started by creating a new server.</p>
			<div class="mt-6">
				<a href="servers/create" class="btn btn-sm variant-soft-primary">
					<AccountPlus size={24} />
					New Server
				</a>
			</div>
		</div>
	{/if}
</section>
