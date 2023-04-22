<script lang="ts">
	import type { PageData } from './$types';
	import type { Account } from 'prisma/prisma-client';

	import { createDataTableStore, dataTableHandler, tableInteraction } from '@skeletonlabs/skeleton';

	import AccountEdit from 'svelte-material-icons/AccountEdit.svelte';

	export let data: PageData;

	let accountsTableStore = createDataTableStore(data.accounts, {
		search: '',
		sort: '',
		pagination: {
			offset: 0,
			limit: 5,
			size: 0,
			amounts: [1, 2, 5, 10]
		}
	});

	accountsTableStore.subscribe((model) => dataTableHandler(model));
</script>

<div class="m-1">
	<h1 id="accounts-header">Accounts</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={$accountsTableStore.search}
				type="search"
				placeholder="Search..."
				class="input"
			/>
			<a href="/admin/servers/create" class="btn bg-primary-400-500-token">
				<span class="mx-1 px-0 py-3 text-token"><AccountEdit /></span>
				<span class="mx-1 px-0 py-2 text-token">Edit</span>
			</a>
		</div>
		<table aria-describedby="accounts-header" class="table table-hover" use:tableInteraction>
			<thead>
				<tr>
					<th>ID</th>
					<th>Email</th>
					<th>Role</th>
					<th>Profile</th>
					<th>Created At</th>
					<th>Updated At</th>
				</tr>
			</thead>
			<tbody>
				{#if $accountsTableStore}
					{#each $accountsTableStore.filtered as account, index}
						<tr>
							<td>
								<a href="/admin/accounts/{account.id}/">{account.id}</a>
							</td>
							<td>{account.email}</td>
							<td>{account.role}</td>
							<td>{account.profile ? 'Profile Found' : 'No Profile Found'}</td>
							<td>{account.createdAt}</td>
							<td>{account.updatedAt}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
