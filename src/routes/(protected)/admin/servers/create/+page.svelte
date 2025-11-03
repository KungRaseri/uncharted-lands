<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionData } from './$types';

	import { Info, Server, ArrowLeft, Network, Hash } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
</script>

<div class="space-y-6 max-w-2xl mx-auto">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Dashboard</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/servers" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Servers</a>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">Create</span>
	</div>

	<!-- Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-center gap-4">
			<div class="p-3 bg-primary-500/10 rounded-lg">
				<Server size={32} class="text-primary-500" />
			</div>
			<div>
				<h1 class="text-3xl font-bold">Create New Server</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
					Set up a new game server for hosting worlds and players
				</p>
			</div>
		</div>
	</div>

	<!-- Form -->
	<div class="card preset-filled-surface-100-900 p-6">
		<form
			action="?/createServer"
			method="POST"
			class="space-y-6"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'failure') invalidateAll();
					applyAction(result);
				};
			}}
		>
			<!-- Server Name -->
			<label for="name" class="label">
				<span class="text-base font-semibold mb-2 flex items-center gap-2">
					<Server size={18} />
					Server Name
					<span class="text-error-500">*</span>
				</span>
				<input
					class="input {form?.invalid && form?.fieldErrors?.name ? 'input-error' : ''}"
					id="name"
					name="name"
					type="text"
					placeholder="e.g., North America Server"
					required
					autofocus
				/>
				{#if form?.fieldErrors?.name}
					<span class="text-sm text-error-500 mt-1">{form.fieldErrors.name}</span>
				{:else}
					<span class="text-sm text-surface-600 dark:text-surface-400 mt-1">
						A friendly name to identify this server
					</span>
				{/if}
			</label>

			<!-- Hostname -->
			<label for="hostname" class="label">
				<span class="text-base font-semibold mb-2 flex items-center gap-2">
					<Network size={18} />
					Hostname
				</span>
				<input
					class="input {form?.fieldErrors?.hostname ? 'input-error' : ''}"
					id="hostname"
					name="hostname"
					type="text"
					placeholder="e.g., server.example.com or 192.168.1.100"
				/>
				{#if form?.fieldErrors?.hostname}
					<span class="text-sm text-error-500 mt-1">{form.fieldErrors.hostname}</span>
				{:else}
					<span class="text-sm text-surface-600 dark:text-surface-400 mt-1">
						The domain name or IP address where the server can be reached
					</span>
				{/if}
			</label>

			<!-- Port -->
			<label for="port" class="label">
				<span class="text-base font-semibold mb-2 flex items-center gap-2">
					<Hash size={18} />
					Port
				</span>
				<input
					class="input {form?.fieldErrors?.port ? 'input-error' : ''}"
					id="port"
					name="port"
					type="number"
					min="5000"
					max="65535"
					placeholder="e.g., 8080"
				/>
				{#if form?.fieldErrors?.port}
					<span class="text-sm text-error-500 mt-1">{form.fieldErrors.port}</span>
				{:else}
					<span class="text-sm text-surface-600 dark:text-surface-400 mt-1">
						Port number (5000-65535) for server connections
					</span>
				{/if}
			</label>

			<!-- Error Message -->
			{#if form?.invalid && form?.message}
				<div class="alert preset-filled-error-500 rounded-md">
					<Info size={20} />
					<span>{form.message}</span>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-3 pt-4">
				<button type="submit" class="btn preset-filled-primary-500 rounded-md flex-1">
					<Server size={20} />
					<span>Create Server</span>
				</button>
				<a href="/admin/servers" class="btn preset-tonal-surface-500 rounded-md">
					<ArrowLeft size={20} />
					<span>Cancel</span>
				</a>
			</div>
		</form>
	</div>
</div>
