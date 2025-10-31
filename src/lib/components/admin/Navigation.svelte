<script lang="ts">
	import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';
	import { writable, type Writable } from 'svelte/store';
	import { page } from '$app/stores';

	import { LayoutDashboard, Server, Globe, Users, FolderSearch, Github } from 'lucide-svelte';

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
			icon: Globe
		},
		{
			label: 'Players',
			title: 'Players',
			href: '/admin/players',
			value: '/admin/players',
			icon: Users
		},
		{
			label: 'Reports',
			title: 'Reports',
			href: '/admin/reports',
			value: '/admin/reports',
			icon: FolderSearch
		}
	];
	$: isActive = (href: string) => (href === $page.url.pathname ? '!bg-primary-active-token' : '');

	const storeValue: Writable<number> = writable(1);
</script>

<AppRail selected={storeValue} class="w-16 sm:w-min text-center align-middle">
	<svelte:fragment slot="lead">
		<AppRailTile
			title="Dashboard"
			tag="a"
			href="/admin"
			value={'/admin'}
			class="p-1 btn btn-sm w-16 
				{isActive('/admin')} 
				hover:variant-ghost-secondary 
				rounded-none"
		>
			<LayoutDashboard size={36} />
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
				{isActive(railTile.href)} 
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
			<Github size={36} />
			<span class="text-xs">src</span>
		</AppRailTile>
	</svelte:fragment>
</AppRail>
