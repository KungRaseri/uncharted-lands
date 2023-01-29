<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	import Information from 'svelte-material-icons/Information.svelte';

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="mx-auto w-fit m-1 p-1">
	<h1 class="m-2">New Server</h1>
	<div class="flex mx-auto card p-4">
		<form
			action="?/createServer"
			method="POST"
			class="bg-surface-600 p-3 rounded-xl space-y-3"
			use:enhance={() => {
				return async ({ result }) => {
					invalidateAll();

					applyAction(result);
				};
			}}
		>
			<div class="mx-1">
				<label for="name">Server Name</label>
				<input id="name" name="name" type="text" />
			</div>
			<div class="mx-1">
				<label for="hostname">Hostname</label>
				<input id="hostname" name="hostname" type="text" />
			</div>
			<div class="mx-1">
				<label for="port">Port</label>
				<input id="port" name="port" min="5001" max="40000" type="number" />
			</div>
			{#if form?.invalid}
				<div class="alert variant-ghost-error w-96 p-4">
					<div class="alert-message flex">
						<span class="px-2 py-6"><Information size={24} /></span>
						{form.message}
					</div>
				</div>
			{/if}
			<button class="btn variant-soft-primary"> Create </button>
		</form>
	</div>
</div>
