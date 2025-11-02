<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar class="bg-surface-200 dark:bg-surface-700 shadow-md px-3 py-0">
	<AppBar.Lead class="place-self-start">
		<div class="btn-group rounded-none preset-filled-secondary-500 text-secondary-50 dark:text-secondary-900">
			<a
				href="/game"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
			>
				Overview
			</a>
			<a
				href="/game/settlements"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
			>
				Settlements
			</a>
			<a
				href="/game/map"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
			>
				Map
			</a>
			<a
				href="/game/wardens"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
			>
				Wardens
			</a>
		</div>
	</AppBar.Lead>

	<AppBar.Trail class="place-self-end">
		<div class="btn-group rounded-none preset-filled-secondary-500 text-secondary-50 dark:text-secondary-900">
			<a
				href="/game/profile"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
				>Profile</a
			>
			<a
				href="/game/history"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
				>History</a
			>
			<a
				href="/game/messages"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
				>Messages</a
			>
			<a
				href="/game/guild"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
				>Guild Forum</a
			>
			<a
				href="/game/guild"
				class="btn btn-sm rounded-none hover:hover:bg-primary-500 hover:text-primary-50 dark:text-primary-900"
				>Guild</a
			>
		</div>
	</AppBar.Trail>
</AppBar>
