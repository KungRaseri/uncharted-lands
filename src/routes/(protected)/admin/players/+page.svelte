<script lang="ts">
	import type { PageData } from './$types';
	import type { Account } from 'prisma/prisma-client';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	import { Users, Search, ExternalLink, Mail, Shield, Calendar, User } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	
	let filteredAccounts = $derived(data.accounts.filter(account => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			account.id.toLowerCase().includes(search) ||
			account.email.toLowerCase().includes(search) ||
			account.role.toLowerCase().includes(search) ||
			(account.profile?.username && account.profile.username.toLowerCase().includes(search))
		);
	}));

	function getRoleBadgeClass(role: string): string {
		switch (role) {
			case 'ADMIN':
				return 'preset-filled-error-500';
			case 'MODERATOR':
				return 'preset-filled-warning-500';
			default:
				return 'preset-filled-surface-500';
		}
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Users size={28} />
				Players
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				Manage player accounts and permissions
			</p>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="card preset-filled-surface-100-900 p-4">
		<div class="relative">
			<Search size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
			<input
				bind:value={searchTerm}
				type="search"
				placeholder="Search by username, email, role, or ID..."
				class="input pl-10 w-full"
			/>
		</div>
		{#if searchTerm}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
				Found {filteredAccounts.length} player{filteredAccounts.length === 1 ? '' : 's'}
			</p>
		{/if}
	</div>

	<!-- Players List -->
	<div class="card preset-filled-surface-100-900">
		{#if filteredAccounts.length === 0}
			<div class="p-12 text-center">
				<Users size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">
					{searchTerm ? 'No players found' : 'No players yet'}
				</h3>
				<p class="text-surface-600 dark:text-surface-400">
					{searchTerm ? 'Try a different search term' : 'Players will appear here once they register'}
				</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="table" aria-describedby="players-header">
					<thead>
						<tr>
							<th>Player</th>
							<th>Email</th>
							<th>Role</th>
							<th>Joined</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredAccounts as account}
							<tr class="hover:preset-tonal-surface-500">
								<td>
									<div class="flex items-center gap-3">
										{#if account.profile?.picture}
											<Avatar src={account.profile.picture} size="sm" />
										{:else}
											<div class="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
												<User size={20} class="text-primary-500" />
											</div>
										{/if}
										<div>
											<p class="font-semibold">
												{account.profile?.username || 'No Username'}
											</p>
											<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">
												{account.id}
											</p>
										</div>
									</div>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<Mail size={14} class="text-surface-400" />
										<span class="text-sm">{account.email}</span>
									</div>
								</td>
								<td>
									<span class="badge {getRoleBadgeClass(account.role)}">
										{account.role}
									</span>
								</td>
								<td>
									<div class="flex items-center gap-2 text-sm">
										<Calendar size={14} class="text-surface-400" />
										<span>{new Date(account.createdAt).toLocaleDateString()}</span>
									</div>
								</td>
								<td class="text-right">
									<a
										href="/admin/players/{account.id}"
										class="btn btn-sm preset-tonal-primary-500 rounded-md"
									>
										<ExternalLink size={16} />
										<span>View</span>
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td colspan="5" class="text-center text-sm text-surface-600 dark:text-surface-400">
								Total Players: {filteredAccounts.length}
								{#if searchTerm}
									(filtered from {data.accounts.length})
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
