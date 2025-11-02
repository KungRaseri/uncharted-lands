<script lang="ts">
	import type { PageData } from './$types';
	import type { Account } from 'prisma/prisma-client';

	import { UserCog } from 'lucide-svelte';

	export let data: PageData;

	let searchTerm = '';
	
	$: filteredAccounts = data.accounts.filter(account => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			account.id.toLowerCase().includes(search) ||
			account.email.toLowerCase().includes(search) ||
			account.role.toLowerCase().includes(search)
		);
	});
</script>

<div class="m-1">
	<h1 id="accounts-header">Accounts</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={searchTerm}
				type="search"
				placeholder="Search..."
				class="input"
			/>
			<a href="/admin/servers/create" class="btn preset-filled-primary-500">
				<span class="mx-1 px-0 py-3 "><UserCog /></span>
				<span class="mx-1 px-0 py-2 ">Edit</span>
			</a>
		</div>
		<div class="table-wrap">
			<table aria-describedby="accounts-header" class="table caption-bottom">
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
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each filteredAccounts as account}
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
				</tbody>
			</table>
		</div>
	</div>
</div>
