<script lang="ts">
	import type { PageData } from './$types';
	import { Shield, Plus, Lock, Check, Info } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let selectedRole = $state<(typeof data.roles)[0] | null>(null);
	let showPermissionsModal = $state(false);

	function openPermissionsModal(role: (typeof data.roles)[0]) {
		selectedRole = role;
		showPermissionsModal = true;
	}

	function closeModals() {
		showCreateModal = false;
		showPermissionsModal = false;
		selectedRole = null;
	}

	function getRoleBadgeClass(roleId: string): string {
		switch (roleId) {
			case 'ADMINISTRATOR':
				return 'preset-filled-error-500';
			case 'SUPPORT':
				return 'preset-filled-warning-500';
			default:
				return 'preset-filled-primary-500';
		}
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

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a href="/admin/settings" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Settings</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">Roles & Permissions</span>
	</div>

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Shield size={28} />
				Roles & Permissions
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				Manage user roles and access control
			</p>
		</div>
		<button
			type="button"
			class="btn preset-filled-primary-500 rounded-md"
			onclick={() => (showCreateModal = true)}
			disabled
			title="Custom role creation coming soon"
		>
			<Plus size={20} />
			<span>Create Role</span>
		</button>
	</div>

	<!-- Info Banner -->
	<div class="card preset-filled-warning-500/10 p-4 border-2 border-warning-500">
		<div class="flex items-start gap-3">
			<Info size={20} class="text-warning-700 dark:text-warning-300 shrink-0 mt-0.5" />
			<div class="text-sm">
				<p class="font-medium text-warning-700 dark:text-warning-300 mb-1">
					System Roles (Read-Only)
				</p>
				<p class="text-warning-800 dark:text-warning-200">
					Current roles are defined in the database schema. To modify these roles, you'll need to
					update the PostgreSQL enum and run migrations. Custom role creation will be added in a
					future update.
				</p>
			</div>
		</div>
	</div>

	<!-- Roles List -->
	<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.roles as role}
			<div class="card preset-filled-surface-100-900 p-6">
				<div class="flex items-start justify-between mb-4">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center">
							<Shield size={24} class="text-primary-500" />
						</div>
						<div>
							<h3 class="text-lg font-bold">{role.name}</h3>
							<span class="badge {getRoleBadgeClass(role.id)} text-xs">{role.id}</span>
						</div>
					</div>
					{#if role.isSystem}
						<span class="badge preset-tonal-surface-500 text-xs">
							<Lock size={12} />
							System
						</span>
					{/if}
				</div>

				<p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
					{role.description}
				</p>

				<div class="space-y-3">
					<div class="flex items-center justify-between text-sm">
						<span class="text-surface-600 dark:text-surface-400">Users</span>
						<span class="font-semibold">{role.userCount}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-surface-600 dark:text-surface-400">Permissions</span>
						<span class="font-semibold">
							{role.permissions.includes('*') ? 'All' : role.permissions.length}
						</span>
					</div>
				</div>

				<div class="mt-4 pt-4 border-t border-surface-300 dark:border-surface-700">
					<button
						type="button"
						class="btn btn-sm preset-tonal-primary-500 w-full rounded-md"
						onclick={() => openPermissionsModal(role)}
					>
						View Permissions
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Permissions Reference -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4">Available Permissions</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.availablePermissions as category}
				<div>
					<h3 class="font-bold text-sm text-surface-600 dark:text-surface-400 uppercase mb-3">
						{category.category}
					</h3>
					<div class="space-y-2">
						{#each category.permissions as permission}
							<div class="text-sm">
								<div class="font-mono text-xs text-primary-500 mb-0.5">
									{permission.id}
								</div>
								<div class="font-semibold">{permission.name}</div>
								<div class="text-xs text-surface-600 dark:text-surface-400">
									{permission.description}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Permissions Detail Modal -->
{#if showPermissionsModal && selectedRole}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={handleBackdropKeydown}></div>
	<div class="modal card preset-filled-surface-100-900 p-6 w-full max-w-2xl shadow-xl">
		<header class="mb-6">
			<div class="flex items-center gap-3 mb-2">
				<Shield size={28} class="text-primary-500" />
				<h3 class="text-2xl font-bold">{selectedRole.name} Permissions</h3>
			</div>
			<p class="text-sm text-surface-600 dark:text-surface-400">
				{selectedRole.description}
			</p>
		</header>

		<div class="space-y-6 max-h-[60vh] overflow-y-auto">
			{#if selectedRole.permissions.includes('*')}
				<div class="card preset-filled-success-500/10 p-4 border-2 border-success-500">
					<div class="flex items-center gap-2">
						<Check size={20} class="text-success-700 dark:text-success-300" />
						<span class="font-medium text-success-700 dark:text-success-300">
							All Permissions Granted
						</span>
					</div>
					<p class="text-sm text-success-800 dark:text-success-200 mt-2">
						This role has unrestricted access to all system functions and permissions.
					</p>
				</div>
			{:else}
				{#each data.availablePermissions as category}
					{@const rolePerms = selectedRole.permissions}
					{@const categoryPerms = category.permissions.filter((p) => rolePerms.includes(p.id))}
					{#if categoryPerms.length > 0}
						<div>
							<h4 class="font-bold text-sm text-surface-600 dark:text-surface-400 uppercase mb-3">
								{category.category}
							</h4>
							<div class="space-y-2">
								{#each categoryPerms as permission}
									<div
										class="flex items-start gap-3 p-3 bg-surface-200 dark:bg-surface-800 rounded-md"
									>
										<Check size={18} class="text-success-500 shrink-0 mt-0.5" />
										<div class="flex-1 min-w-0">
											<div class="font-semibold text-sm">{permission.name}</div>
											<div class="font-mono text-xs text-primary-500 mb-1">
												{permission.id}
											</div>
											<div class="text-xs text-surface-600 dark:text-surface-400">
												{permission.description}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>

		<footer
			class="flex justify-end gap-2 mt-6 pt-4 border-t border-surface-300 dark:border-surface-700"
		>
			<button type="button" class="btn preset-tonal-surface-500 rounded-md" onclick={closeModals}>
				Close
			</button>
		</footer>
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
