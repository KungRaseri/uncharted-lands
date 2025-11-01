<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar class="bg-surface-200 dark:bg-surface-700 shadow-md px-3 py-0">
	<AppBar.Lead class="place-self-start">
		<div class="btn-group rounded-none variant-filled-secondary text-secondary-50-900-token">
			<a
				href="/game"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
			>
				Overview
			</a>
			<a
				href="/game/settlements"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
			>
				Settlements
			</a>
			<a
				href="/game/map"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
			>
				Map
			</a>
			<a
				href="/game/wardens"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
			>
				Wardens
			</a>
		</div>
	</AppBar.Lead>

	<AppBar.Trail class="place-self-end">
		<div class="btn-group rounded-none variant-filled-secondary text-secondary-50-900-token">
			<a
				href="/game/profile"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
				>Profile</a
			>
			<a
				href="/game/history"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
				>History</a
			>
			<a
				href="/game/messages"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
				>Messages</a
			>
			<a
				href="/game/guild"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
				>Guild Forum</a
			>
			<a
				href="/game/guild"
				class="btn btn-sm rounded-none hover:bg-primary-hover-token hover:text-primary-50-900-token"
				>Guild</a
			>
		</div>
	</AppBar.Trail>
</AppBar>
