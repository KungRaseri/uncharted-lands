<script lang="ts">
	import { AppShell, AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import { writable, type Writable } from 'svelte/store';
	import { page } from '$app/stores';

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
			label: 'Accounts',
			title: 'Accounts',
			href: '/admin/accounts',
			value: '/admin/accounts',
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

<AppRail selected={storeValue} class="w-16 sm:w-min text-center align-middle">
	<svelte:fragment slot="lead">
		<AppRailTile
			title="Dashboard"
			tag="a"
			href="/admin"
			value={'/admin'}
			class="py-1 px-0 btn btn-sm w-16 
				{$page.route.id === '/(protected)/admin' ? 'bg-primary-active-token' : ''} 
				hover:variant-ghost-secondary 
				rounded-none"
		>
			<ViewDashboard width="100%" size={36} />
			<span class="text-xs">Dashboard</span>
		</AppRailTile>
	</svelte:fragment>
	{#each railTiles as railTile}
		<AppRailTile
			title={railTile.title}
			tag="a"
			href={railTile.href}
			value={railTile.value}
			class="py-1 px-0 btn btn-sm w-16 
				{$page.route.id?.includes(railTile.value) ? 'bg-primary-active-token' : ''} 
				hover:variant-ghost-secondary 
				rounded-none"
		>
			<div class="mx-auto w-fit"><svelte:component this={railTile.icon} size={36} /></div>
			<span class="text-xs">{railTile.label}</span>
		</AppRailTile>
	{/each}
	<svelte:fragment slot="trail">
		<AppRailTile
			tag="a"
			href="https://github.com/RedSyndicate/browser-game"
			class="py-1 px-0 btn btn-sm w-16 variant-soft-surface hover:variant-ghost-secondary rounded-none"
		>
			<Github width="100%" size={36} />
			<span class="text-xs">src</span>
		</AppRailTile>
	</svelte:fragment>
</AppRail>
