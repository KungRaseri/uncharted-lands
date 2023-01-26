<script lang="ts">
	import { AppShell, AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import { writable, type Writable } from 'svelte/store';

	import ViewDashboard from 'svelte-material-icons/ViewDashboard.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import Web from 'svelte-material-icons/Web.svelte';
	import AccountGroup from 'svelte-material-icons/AccountGroup.svelte';
	import FolderSearchOutline from 'svelte-material-icons/FolderSearchOutline.svelte';
	import Github from 'svelte-material-icons/Github.svelte';

	let railTiles: Array<any> = [
		{
			label: 'Servers',
			title: 'Servers',
			href: '/admin/servers',
			value: '/admin/servers',
			icon: Server
		},
		{
			label: 'Worlds',
			title: 'Worlds',
			href: '/admin/worlds',
			value: '/admin/worlds',
			icon: Web
		},
		{
			label: 'Players',
			title: 'Players',
			href: '/admin/players',
			value: '/admin/players',
			icon: AccountGroup
		},
		{
			label: 'Reports',
			title: 'Reports',
			href: '/admin/reports',
			value: '/admin/reports',
			icon: FolderSearchOutline
		}
	];

	const storeValue: Writable<number> = writable(1);
</script>

<AppRail selected={storeValue} class="w-16 sm:w-min text-center align-middle space-y-1">
	<svelte:fragment slot="lead">
		<AppRailTile
			label="Dashboard"
			title="Dashboard"
			tag="a"
			href="/admin"
			value={'/admin'}
			class="m-0 py-2 px-1 btn variant-soft-surface hover:variant-ghost-primary rounded-none items-center justify-center"
		>
			<ViewDashboard width="100%" size={36} />
		</AppRailTile>
	</svelte:fragment>
	{#each railTiles as railTile}
		<AppRailTile
			label={railTile.label}
			title={railTile.title}
			tag="a"
			href={railTile.href}
			value={railTile.value}
			class="m-0 py-2 px-1 btn variant-soft-surface hover:variant-ghost-primary rounded-none items-center justify-center"
		>
			<div class="mx-auto w-fit"><svelte:component this={railTile.icon} size={24} /></div>
		</AppRailTile>
	{/each}
	<svelte:fragment slot="trail">
		<AppRailTile
			tag="a"
			href="https://github.com/RedSyndicate/browser-game"
			class="m-0 py-2 px-1 btn variant-soft-surface hover:variant-ghost-primary rounded-none items-center justify-center"
		>
			<Github width="100%" size={36} />
			<span class="text-sm">src</span>
		</AppRailTile>
	</svelte:fragment>
</AppRail>
