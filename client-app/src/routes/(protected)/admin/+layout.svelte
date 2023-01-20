<script lang="ts">
	import { AppShell, AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import { writable, type Writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	import ViewDashboard from 'svelte-material-icons/ViewDashboard.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import Web from 'svelte-material-icons/Web.svelte';
	import AccountGroup from 'svelte-material-icons/AccountGroup.svelte';
	import FolderSearchOutline from 'svelte-material-icons/FolderSearchOutline.svelte';
	import Github from 'svelte-material-icons/Github.svelte';

	// export let data: LayoutData;
	const storeValue: Writable<number> = writable(1);
</script>

<AppShell slotSidebarLeft="w-18 h-auto" slotPageContent="h-full">
	<svelte:fragment slot="sidebarLeft">
		<AppRail selected={storeValue} class="text-center p-2">
			<svelte:fragment slot="lead">
				<AppRailTile
					label="Dashboard"
					title="Dashboard"
					tag="a"
					href="/admin"
					value={'/admin'}
					class="text-surface-300 hover:text-primary-100 mb-3"
				>
					<ViewDashboard size={56} />
				</AppRailTile>
			</svelte:fragment>
			<AppRailTile
				label="Servers"
				title="Servers"
				tag="a"
				href="/admin/servers"
				value={'/admin/servers'}
				class="text-surface-300 hover:text-primary-100 mb-3"
			>
				<Server size={56} />
			</AppRailTile>
			<AppRailTile
				label="Worlds"
				title="Worlds"
				tag="a"
				href="/admin/worlds"
				value={'/admin/worlds'}
				class="text-surface-300 hover:text-primary-100 mb-3"
			>
				<Web size={56} />
			</AppRailTile>
			<AppRailTile
				label="Players"
				title="Players"
				tag="a"
				href="/admin/players"
				value={'/admin/players'}
				class="text-surface-300 hover:text-primary-100 mb-3"
			>
				<AccountGroup size={56} />
			</AppRailTile>
			<AppRailTile
				label="Reports"
				title="Reports"
				tag="a"
				href="/admin/reports"
				value={'/admin/reports'}
				class="text-surface-300 hover:text-primary-100 mb-3"
			>
				<FolderSearchOutline size={56} />
			</AppRailTile>
			<svelte:fragment slot="trail">
				<AppRailTile
					tag="a"
					href="https://github.com/RedSyndicate/browser-game"
					class="text-surface-300 hover:text-primary-100 mb-3"
				>
					<Github size={56} />
					<span class="text-sm">src</span>
				</AppRailTile>
			</svelte:fragment>
		</AppRail>
	</svelte:fragment>
	<div class="px-5 py-2">
		<slot />
	</div>
</AppShell>
