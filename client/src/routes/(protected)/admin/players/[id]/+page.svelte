<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import type { PageData } from './$types';
	import {
		User,
		Mail,
		Shield,
		Calendar,
		ArrowLeft,
		ExternalLink,
		Building2
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let profile = $derived(data.account.profile);

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
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/players"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Players</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{profile?.username || data.account.email}</span>
	</div>

	<!-- Player Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<!-- Avatar -->
			<div class="flex-none">
				{#if profile?.picture}
					<Avatar class="ring-4 ring-primary-500/20">
						<img
							src={profile.picture}
							alt="{profile.username || 'User'} avatar"
							class="w-24 h-24 rounded-full"
						/>
					</Avatar>
				{:else}
					<div
						class="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center ring-4 ring-primary-500/20"
					>
						<User size={48} class="text-primary-500" />
					</div>
				{/if}
			</div>

			<!-- Info -->
			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">{profile?.username || 'No Username'}</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">
					{data.account.id}
				</p>

				<div class="flex flex-wrap gap-3">
					<span class="badge {getRoleBadgeClass(data.account.role)} text-sm px-3 py-1">
						<Shield size={14} />
						{data.account.role}
					</span>
					<span class="badge preset-tonal-surface-500 text-sm px-3 py-1">
						<Calendar size={14} />
						Joined {new Date(data.account.createdAt).toLocaleDateString()}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Account Details -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Contact Information -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<Mail size={24} />
				Contact Information
			</h2>

			<div class="space-y-4">
				<div>
					<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
						Email Address
					</div>
					<p class="font-semibold">{data.account.email}</p>
				</div>

				{#if profile?.username}
					<div>
						<div
							class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1"
						>
							Username
						</div>
						<p class="font-semibold">{profile.username}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Account Details -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<User size={24} />
				Account Details
			</h2>

			<div class="space-y-4">
				<div>
					<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
						Role
					</div>
					<p class="font-semibold">{data.account.role}</p>
				</div>

				<div>
					<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
						Account Created
					</div>
					<p class="font-semibold">
						{new Date(data.account.createdAt).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</p>
				</div>

				<div>
					<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
						Last Updated
					</div>
					<p class="font-semibold">
						{new Date(data.account.updatedAt).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Profile Information (if exists) -->
	{#if profile}
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4">Profile Information</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
						Profile ID
					</div>
					<p class="font-mono text-sm">{profile.id}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Settlement Information -->
	{#if profile}
		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-bold flex items-center gap-2">
					<Building2 size={24} />
					Settlements
				</h2>
				<span class="badge preset-tonal-primary-500 text-sm px-3 py-1">
					{data.settlements?.length || 0} Total
				</span>
			</div>

			{#if data.settlements && data.settlements.length > 0}
				<div class="space-y-3">
					{#each data.settlements as settlement}
						<div
							class="p-4 bg-surface-200 dark:bg-surface-700 rounded-md hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-start gap-3 flex-1">
									<div
										class="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0"
									>
										<Building2 size={20} class="text-primary-500" />
									</div>
									<div class="flex-1 min-w-0">
										<p class="font-semibold text-lg mb-1">{settlement.name}</p>
										<p
											class="text-xs text-surface-600 dark:text-surface-400 font-mono mb-3"
										>
											ID: {settlement.id}
										</p>

										<!-- Quick Overview -->
										<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
											<div>
												<div
													class="text-xs text-surface-500 dark:text-surface-400"
												>
													Structures
												</div>
												<div class="font-semibold">
													{settlement.structures?.length || 0}
												</div>
											</div>
											<div>
												<div
													class="text-xs text-surface-500 dark:text-surface-400"
												>
													Plots
												</div>
												<div class="font-semibold">
													{settlement.plot?.length || 0}
												</div>
											</div>
											<div>
												<div
													class="text-xs text-surface-500 dark:text-surface-400"
												>
													Resources
												</div>
												<div class="font-semibold">
													{settlement.storage
														? Object.keys(settlement.storage).length
														: 0}
												</div>
											</div>
											<div>
												<div
													class="text-xs text-surface-500 dark:text-surface-400"
												>
													Created
												</div>
												<div class="font-semibold text-xs">
													{new Date(
														settlement.createdAt
													).toLocaleDateString()}
												</div>
											</div>
										</div>
									</div>
								</div>
								<a
									href="/admin/settlements/{settlement.id}"
									class="btn btn-sm preset-tonal-primary-500 rounded-md shrink-0"
								>
									<ExternalLink size={14} />
									<span>View</span>
								</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8">
					<Building2 size={48} class="mx-auto mb-3 text-surface-400" />
					<p class="text-surface-600 dark:text-surface-400">No settlements yet</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Back Button -->
	<div>
		<a href="/admin/players" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to Players</span>
		</a>
	</div>
</div>
