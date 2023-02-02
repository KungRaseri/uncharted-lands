<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	import Information from 'svelte-material-icons/Information.svelte';

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="mx-auto w-96 m-1">
	<div class="card p-3 rounded-md bg-surface-200-700-token">
		<h2 class="px-3">New Server</h2>
		<form
			action="?/createServer"
			method="POST"
			class="p-3 space-y-1 md:space-y-3"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'failure') invalidateAll();

					applyAction(result);
				};
			}}
		>
			<div class="mx-1">
				<label for="name">Server Name</label>
				<input
					class={form?.invalid ? 'input-error' : 'variant-ghost-surface'}
					id="name"
					name="name"
					type="text"
				/>
			</div>
			<div class="mx-1">
				<label for="hostname">Hostname</label>
				<input
					class={form?.invalid ? 'input-error' : 'variant-ghost-surface'}
					id="hostname"
					name="hostname"
					type="text"
				/>
			</div>
			<div class="mx-1">
				<label for="port">Port</label>
				<input
					class={form?.invalid ? 'input-error' : 'variant-ghost-surface'}
					id="port"
					name="port"
					min="5001"
					max="40000"
					type="number"
				/>
			</div>
			{#if form?.invalid}
				<div class="alert variant-ghost-error">
					<div class="alert-message">
						<Information size={24} />
						{form.message ?? 'Unknown Error'}
					</div>
				</div>
			{/if}

			<button class="w-full p-2 btn bg-primary-400-500-token rounded-md">Create</button>
		</form>
	</div>
</div>
