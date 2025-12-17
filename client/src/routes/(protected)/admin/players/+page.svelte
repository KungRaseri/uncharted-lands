<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Users,
		Search,
		ExternalLink,
		Mail,
		Calendar,
		User,
		EllipsisVertical,
		Ban,
		Trash2,
		UserCog
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	let showEditModal = $state(false);
	let showBanModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedAccount = $state<(typeof data.accounts)[0] | null>(null);
	let editRole = $state<string>('MEMBER');
	let isSubmitting = $state(false);
	let openDropdownId = $state<string | null>(null);

	let filteredAccounts = $derived(
		data.accounts.filter((account) => {
			if (!searchTerm) return true;
			const search = searchTerm.toLowerCase();
			return (
				account.id.toLowerCase().includes(search) ||
				account.email.toLowerCase().includes(search) ||
				account.role.toLowerCase().includes(search) ||
				(account.profile?.username &&
					account.profile.username.toLowerCase().includes(search))
			);
		})
	);

	function getRoleBadgeClass(role: string): string {
		switch (role) {
			case 'ADMINISTRATOR':
				return 'preset-filled-error-500';
			case 'SUPPORT':
				return 'preset-filled-warning-500';
			default:
				return 'preset-filled-surface-500';
		}
	}

	function toggleDropdown(accountId: string) {
		openDropdownId = openDropdownId === accountId ? null : accountId;
	}

	function openEditModal(account: (typeof data.accounts)[0]) {
		selectedAccount = account;
		editRole = account.role;
		showEditModal = true;
		openDropdownId = null;
	}

	function openBanModal(account: (typeof data.accounts)[0]) {
		selectedAccount = account;
		showBanModal = true;
		openDropdownId = null;
	}

	function openDeleteModal(account: (typeof data.accounts)[0]) {
		selectedAccount = account;
		showDeleteModal = true;
		openDropdownId = null;
	}

	function closeModals() {
		showEditModal = false;
		showBanModal = false;
		showDeleteModal = false;
		selectedAccount = null;
		isSubmitting = false;
	}

	function handleBackdropClick() {
		closeModals();
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModals();
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
					{searchTerm
						? 'Try a different search term'
						: 'Players will appear here once they register'}
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
											<div class="relative w-10 h-10">
												<img
													src={account.profile.picture}
													alt="{account.profile.username ||
														'User'} avatar"
													class="w-10 h-10 rounded-full object-cover"
													onerror={(e) => {
														// If image fails to load, replace with icon
														const parent =
															e.currentTarget.parentElement;
														e.currentTarget.remove();
														const fallback =
															document.createElement('div');
														fallback.className =
															'w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center';
														const svg = document.createElementNS(
															'http://www.w3.org/2000/svg',
															'svg'
														);
														svg.setAttribute('width', '20');
														svg.setAttribute('height', '20');
														svg.setAttribute('viewBox', '0 0 24 24');
														svg.setAttribute('fill', 'none');
														svg.setAttribute('stroke', 'currentColor');
														svg.setAttribute('stroke-width', '2');
														svg.setAttribute(
															'class',
															'text-primary-500'
														);
														svg.innerHTML =
															'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>';
														fallback.appendChild(svg);
														parent?.appendChild(fallback);
													}}
												/>
											</div>
										{:else}
											<div
												class="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center"
											>
												<User size={20} class="text-primary-500" />
											</div>
										{/if}
										<div>
											<p class="font-semibold">
												{account.profile?.username || 'No Username'}
											</p>
											<p
												class="text-xs text-surface-600 dark:text-surface-400 font-mono"
											>
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
										<span
											>{new Date(
												account.createdAt
											).toLocaleDateString()}</span
										>
									</div>
								</td>
								<td class="text-right">
									<div class="flex items-center justify-end gap-2">
										<a
											href="/admin/players/{account.id}"
											class="btn btn-sm preset-tonal-primary-500 rounded-md"
										>
											<ExternalLink size={16} />
											<span>View</span>
										</a>

										<div class="relative">
											<button
												type="button"
												class="btn btn-sm preset-tonal-surface-500 rounded-md"
												onclick={() => toggleDropdown(account.id)}
											>
												<EllipsisVertical size={16} />
											</button>
											{#if openDropdownId === account.id}
												<div
													class="absolute right-0 top-full mt-1 card preset-filled-surface-100-900 p-2 w-48 shadow-xl z-50"
												>
													<nav class="list-nav">
														<ul>
															<li>
																<button
																	type="button"
																	class="list-option w-full text-left"
																	onclick={() =>
																		openEditModal(account)}
																>
																	<span
																		class="flex items-center gap-2"
																	>
																		<UserCog size={16} />
																		<span>Edit Role</span>
																	</span>
																</button>
															</li>
															<li>
																<button
																	type="button"
																	class="list-option w-full text-left"
																	onclick={() =>
																		openBanModal(account)}
																>
																	<span
																		class="flex items-center gap-2"
																	>
																		<Ban size={16} />
																		<span>Ban Player</span>
																	</span>
																</button>
															</li>
															<li>
																<button
																	type="button"
																	class="list-option w-full text-left text-error-500"
																	onclick={() =>
																		openDeleteModal(account)}
																>
																	<span
																		class="flex items-center gap-2"
																	>
																		<Trash2 size={16} />
																		<span>Delete Account</span>
																	</span>
																</button>
															</li>
														</ul>
													</nav>
												</div>
											{/if}
										</div>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td
								colspan="5"
								class="text-center text-sm text-surface-600 dark:text-surface-400"
							>
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

<!-- Edit Role Modal -->
{#if showEditModal && selectedAccount}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="presentation"
		tabindex="-1"
	></div>
	<div class="modal card preset-filled-surface-100-900 p-6 w-full max-w-md shadow-xl">
		<header class="mb-4">
			<h3 class="text-2xl font-bold flex items-center gap-2">
				<UserCog size={24} />
				Edit Player Role
			</h3>
		</header>

		<form
			method="POST"
			action="?/updateRole"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update, result }) => {
					await update();
					isSubmitting = false;
					if (result.type === 'success') {
						closeModals();
					}
				};
			}}
		>
			<input type="hidden" name="accountId" value={selectedAccount.id} />

			<div class="space-y-4">
				<div>
					<p class="label mb-2">
						<span class="font-medium">Player</span>
					</p>
					<div class="card preset-tonal-surface-500 p-3">
						<p class="font-semibold">
							{selectedAccount.profile?.username || 'No Username'}
						</p>
						<p class="text-sm text-surface-600 dark:text-surface-400">
							{selectedAccount.email}
						</p>
					</div>
				</div>

				<div>
					<label for="role-select" class="label mb-2">
						<span class="font-medium">Role</span>
					</label>
					<select
						id="role-select"
						name="role"
						bind:value={editRole}
						class="select"
						required
					>
						<option value="MEMBER">Member</option>
						<option value="SUPPORT">Support</option>
						<option value="ADMINISTRATOR">Administrator</option>
					</select>
					<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
						Current role: <span class="font-semibold">{selectedAccount.role}</span>
					</p>
				</div>
			</div>

			<footer class="flex justify-end gap-2 mt-6">
				<button
					type="button"
					class="btn preset-tonal-surface-500 rounded-md"
					onclick={closeModals}
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="btn preset-filled-primary-500 rounded-md"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</button>
			</footer>
		</form>
	</div>
{/if}

<!-- Ban Player Modal -->
{#if showBanModal && selectedAccount}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="presentation"
		tabindex="-1"
	></div>
	<div class="modal card preset-filled-surface-100-900 p-6 w-full max-w-md shadow-xl">
		<header class="mb-4">
			<h3 class="text-2xl font-bold flex items-center gap-2 text-warning-500">
				<Ban size={24} />
				Ban Player
			</h3>
		</header>

		<div class="space-y-4">
			<div class="card preset-filled-warning-500/10 p-4 border-2 border-warning-500">
				<p class="font-medium text-warning-700 dark:text-warning-300 mb-2">
					This feature is coming soon!
				</p>
				<p class="text-sm text-surface-700 dark:text-surface-300">
					Player banning functionality will be implemented in a future update. This will
					allow you to temporarily or permanently restrict player access.
				</p>
			</div>

			<div class="card preset-tonal-surface-500 p-3">
				<p class="font-semibold">{selectedAccount.profile?.username || 'No Username'}</p>
				<p class="text-sm text-surface-600 dark:text-surface-400">
					{selectedAccount.email}
				</p>
			</div>
		</div>

		<footer class="flex justify-end gap-2 mt-6">
			<button
				type="button"
				class="btn preset-tonal-surface-500 rounded-md"
				onclick={closeModals}
			>
				Close
			</button>
		</footer>
	</div>
{/if}

<!-- Delete Account Modal -->
{#if showDeleteModal && selectedAccount}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="presentation"
		tabindex="-1"
	></div>
	<div class="modal card preset-filled-surface-100-900 p-6 w-full max-w-md shadow-xl">
		<header class="mb-4">
			<h3 class="text-2xl font-bold flex items-center gap-2 text-error-500">
				<Trash2 size={24} />
				Delete Account
			</h3>
		</header>

		<form
			method="POST"
			action="?/deleteAccount"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update, result }) => {
					await update();
					isSubmitting = false;
					if (result.type === 'success') {
						closeModals();
					}
				};
			}}
		>
			<input type="hidden" name="accountId" value={selectedAccount.id} />

			<div class="space-y-4">
				<div class="card preset-filled-error-500/10 p-4 border-2 border-error-500">
					<p class="font-medium text-error-700 dark:text-error-300 mb-2">
						⚠️ This action cannot be undone!
					</p>
					<p class="text-sm text-surface-700 dark:text-surface-300">
						Deleting this account will permanently remove all associated data including
						profile, settlements, and game progress.
					</p>
				</div>

				<div class="card preset-tonal-surface-500 p-3">
					<p class="font-semibold">
						{selectedAccount.profile?.username || 'No Username'}
					</p>
					<p class="text-sm text-surface-600 dark:text-surface-400">
						{selectedAccount.email}
					</p>
					<p class="text-xs text-surface-500 dark:text-surface-500 mt-1 font-mono">
						ID: {selectedAccount.id}
					</p>
				</div>

				<div>
					<label for="delete-confirm" class="label mb-2">
						<span class="font-medium">Type DELETE to confirm</span>
					</label>
					<input
						id="delete-confirm"
						type="text"
						name="confirmation"
						class="input"
						placeholder="DELETE"
						pattern="DELETE"
						required
						autocomplete="off"
					/>
				</div>
			</div>

			<footer class="flex justify-end gap-2 mt-6">
				<button
					type="button"
					class="btn preset-tonal-surface-500 rounded-md"
					onclick={closeModals}
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="btn preset-filled-error-500 rounded-md"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Deleting...' : 'Delete Account'}
				</button>
			</footer>
		</form>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 998;
		backdrop-filter: blur(4px);
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 999;
		max-height: 90vh;
		overflow-y: auto;
	}
</style>
