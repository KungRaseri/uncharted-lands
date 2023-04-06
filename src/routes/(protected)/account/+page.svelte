<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Account | Uncharted Lands</title>
</svelte:head>

<div class="mt-5 mx-auto w-full sm:w-96">
	<div class="card bg-surface-400-500-token p-0 rounded-none sm:rounded-3xl">
		<header class="w-full p-4 card-header flex border-b border-b-surface-50 justify-between">
			<h2 class="text-primary-50-900-token">Account</h2>
			<button type="button" class="btn btn-small variant-soft-primary" disabled>Edit</button>
		</header>
		<div class="m-3 pb-5">
			<dl class="grid grid-cols-1">
				<div class="my-1 border-b border-surface-400 border-dotted">
					<dt class="text-primary-50-900-token text-md font-medium">ID</dt>
					<dd class="text-secondary-50-900-token text-md font-medium">{data.account?.id}</dd>
				</div>
				<div class="my-1 border-b border-surface-400 border-dotted">
					<dt class="text-primary-50-900-token text-md font-medium">Email address</dt>
					<dd class="text-secondary-50-900-token text-md font-medium">{data.account?.email}</dd>
				</div>
				<div class="my-1 border-b border-surface-400 border-dotted">
					<dt class="text-primary-50-900-token text-md font-medium">Role</dt>
					<dd class="text-secondary-50-900-token text-md font-medium">{data.account?.role}</dd>
				</div>
			</dl>
		</div>
		<div class="m-3 pb-3">
			<div class="card variant-filled-secondary" />
		</div>
	</div>
</div>
