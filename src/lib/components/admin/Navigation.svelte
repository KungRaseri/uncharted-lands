<script lang="ts">
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
	$: isActive = (href: string) => (href === $page.url.pathname ? 'bg-primary-500 dark:bg-primary-600' : '');
</script>

<nav class="flex flex-col w-16 sm:w-20 bg-surface-100 dark:bg-surface-800 h-full">
	<!-- Lead -->
	<div class="flex-none">
		<a
			href="/admin"
			title="Dashboard"
			class="flex flex-col items-center justify-center p-2 btn btn-sm w-full {isActive('/admin')} hover:bg-surface-200 dark:hover:bg-surface-700 rounded-none"
		>
			<LayoutDashboard size={36} />
			<span class="text-xs mt-1">Dashboard</span>
		</a>
	</div>

	<!-- Main items -->
	<div class="flex-1">
		{#each railTiles as railTile}
			<a
				href={railTile.href}
				title={railTile.title}
				class="flex flex-col items-center justify-center py-2 px-0 btn btn-sm w-full {isActive(railTile.href)} hover:bg-surface-200 dark:hover:bg-surface-700 rounded-none"
			>
				<svelte:component this={railTile.icon} size={36} />
				<span class="text-xs mt-1">{railTile.label}</span>
			</a>
		{/each}
	</div>

	<!-- Trail -->
	<div class="flex-none">
		<a
			href="https://github.com/RedSyndicate/browser-game"
			target="_blank"
			rel="noopener noreferrer"
			title="Source Code"
			class="flex flex-col items-center justify-center p-2 btn btn-sm w-full hover:bg-surface-200 dark:hover:bg-surface-700 rounded-none"
		>
			<Github size={36} />
			<span class="text-xs mt-1">src</span>
		</a>
	</div>
</nav>
