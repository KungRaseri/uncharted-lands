<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import type { PageData } from './$types';
	import { User, Mail, Shield, Calendar, ArrowLeft, ExternalLink } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let profile = $derived(data.account.profile);

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

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Dashboard</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/players" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Players</a>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{profile?.username || data.account.email}</span>
	</div>

	<!-- Player Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<!-- Avatar -->
			<div class="flex-none">
				{#if profile?.picture}
					<Avatar src={profile.picture} size="xl" class="ring-4 ring-primary-500/20" />
				{:else}
					<div class="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center ring-4 ring-primary-500/20">
						<User size={48} class="text-primary-500" />
					</div>
				{/if}
			</div>

			<!-- Info -->
			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">{profile?.username || 'No Username'}</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">{data.account.id}</p>
				
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
					<label class="text-sm text-surface-600 dark:text-surface-400">Email Address</label>
					<p class="font-semibold">{data.account.email}</p>
				</div>
				
				{#if profile?.username}
					<div>
						<label class="text-sm text-surface-600 dark:text-surface-400">Username</label>
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
					<label class="text-sm text-surface-600 dark:text-surface-400">Role</label>
					<p class="font-semibold">{data.account.role}</p>
				</div>
				
				<div>
					<label class="text-sm text-surface-600 dark:text-surface-400">Account Created</label>
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
					<label class="text-sm text-surface-600 dark:text-surface-400">Last Updated</label>
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
					<label class="text-sm text-surface-600 dark:text-surface-400">Profile ID</label>
					<p class="font-mono text-sm">{profile.id}</p>
				</div>
				
				{#if profile.bio}
					<div class="md:col-span-2">
						<label class="text-sm text-surface-600 dark:text-surface-400">Bio</label>
						<p>{profile.bio}</p>
					</div>
				{/if}
			</div>
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
