<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import type { World } from '$lib/types/game';
	import { Flame, Server, Globe, User, Rocket, AlertCircle } from 'lucide-svelte';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let selectedServer = $state('');
	let selectedWorld = $state('');
	let username = $state('');
	let isSubmitting = $state(false);

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let availableWorlds = $derived(data.worlds.filter((w: World) => w.serverId === selectedServer));
</script>

<div class="min-h-screen flex items-center justify-center p-6">
	<div class="card preset-filled-surface-100-900 p-8 max-w-2xl w-full">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="flex items-center justify-center mb-4">
				<div class="p-4 bg-primary-500/10 rounded-full">
					<Rocket size={48} class="text-primary-500" />
				</div>
			</div>
			<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">
				Welcome to Uncharted Lands!
			</h1>
			<p class="text-surface-600 dark:text-surface-400">
				Let's get you started on your journey. Choose your server, world, and create your profile.
			</p>
		</div>

		<form
			action="?/settle"
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result }) => {
					isSubmitting = false;
					invalidateAll();
					applyAction(result);
				};
			}}
			class="space-y-6"
		>
			<!-- Error Message -->
			{#if form?.message}
				<div class="alert preset-filled-error-500 flex items-start gap-3 p-4 rounded-lg">
					<AlertCircle size={20} class="shrink-0 mt-0.5" />
					<div>
						<p class="font-semibold">Error</p>
						<p class="text-sm">{form.message}</p>
					</div>
				</div>
			{/if}

			<!-- Server Selection -->
			<div>
				<label for="server" class="label mb-2">
					<span class="label-text flex items-center gap-2 text-surface-900 dark:text-surface-100">
						<Server size={18} />
						Choose Server
					</span>
				</label>
				<select
					id="server"
					name="server"
					class="select preset-filled-surface-200-700 w-full"
					bind:value={selectedServer}
					required
				>
					<option value="" disabled>Select a server...</option>
					{#each data.servers as server}
						<option value={server.id}>{server.name}</option>
					{/each}
				</select>
				<p class="text-xs text-surface-600 dark:text-surface-400 mt-1">
					Pick the server where you want to play
				</p>
			</div>

			<!-- World Selection -->
			<div>
				<label for="world" class="label mb-2">
					<span class="label-text flex items-center gap-2 text-surface-900 dark:text-surface-100">
						<Globe size={18} />
						Choose World
					</span>
				</label>
				<select
					id="world"
					name="world"
					class="select preset-filled-surface-200-700 w-full"
					bind:value={selectedWorld}
					disabled={!selectedServer}
					required
				>
					<option value="" disabled>
						{selectedServer ? 'Select a world...' : 'Select a server first...'}
					</option>
					{#each availableWorlds as world}
						<option value={world.id}>{world.name}</option>
					{/each}
				</select>
				<p class="text-xs text-surface-600 dark:text-surface-400 mt-1">
					{#if selectedServer}
						{availableWorlds.length} world{availableWorlds.length === 1 ? '' : 's'} available on this
						server
					{:else}
						Choose a server to see available worlds
					{/if}
				</p>
			</div>

			<!-- Username -->
			<div>
				<label for="username" class="label mb-2">
					<span class="label-text flex items-center gap-2 text-surface-900 dark:text-surface-100">
						<User size={18} />
						Choose Username
					</span>
				</label>
				<input
					id="username"
					type="text"
					name="username"
					class="input preset-filled-surface-200-700 w-full"
					bind:value={username}
					placeholder="Enter your username..."
					required
					minlength="3"
					maxlength="20"
				/>
				<p class="text-xs text-surface-600 dark:text-surface-400 mt-1">
					This will be your display name in the game (3-20 characters)
				</p>
			</div>

			<!-- Submit Button -->
			<div class="pt-4">
				<button
					disabled={!selectedWorld || !username || username.length < 3 || isSubmitting}
					type="submit"
					class="btn preset-filled-primary-500 rounded-md w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Flame size={24} />
					<span>{isSubmitting ? 'Creating Settlement...' : 'Settle in this World'}</span>
				</button>
			</div>
		</form>

		<!-- Debug Info (remove in production) -->
		{#if selectedServer || selectedWorld || username}
			<div class="mt-6 p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">Selection:</p>
				<div class="space-y-1 text-xs text-surface-600 dark:text-surface-400 font-mono">
					{#if selectedServer}
						<p>Server: {selectedServer}</p>
					{/if}
					{#if selectedWorld}
						<p>World: {selectedWorld}</p>
					{/if}
					{#if username}
						<p>Username: {username}</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
