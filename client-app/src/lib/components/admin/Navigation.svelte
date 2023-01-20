<script lang="ts">
	import { AppShell, AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import { writable, type Writable } from 'svelte/store';

	import ViewDashboard from 'svelte-material-icons/ViewDashboard.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import Web from 'svelte-material-icons/Web.svelte';
	import Group from 'svelte-material-icons/Group.svelte';
	import FolderSearchOutline from 'svelte-material-icons/FolderSearchOutline.svelte';

	const storeValue: Writable<number> = writable(1);
</script>

<AppRail selected={storeValue}>
	<svelte:fragment slot="lead">
		<AppRailTile label="Dashboard" title="Dashboard" value={1}>
			<ViewDashboard size={48} />
		</AppRailTile>
	</svelte:fragment>
	<AppRailTile label="Servers" title="Servers" value={2}>
		<Server size={48} />
	</AppRailTile>
	<AppRailTile label="Worlds" title="Worlds" value={3}>
		<Web size={48} />
	</AppRailTile>
	<AppRailTile label="Players" title="Players" value={4}>
		<Group size={48} />
	</AppRailTile>
	<AppRailTile label="Reports" title="Reports" value={5}>
		<FolderSearchOutline size={48} />
	</AppRailTile>
	<svelte:fragment slot="trail" />
</AppRail>