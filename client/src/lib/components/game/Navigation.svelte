<script lang="ts">
	import { page } from '$app/state';
	import { Home, Building2, Map, Shield, User, History, Mail, Users } from 'lucide-svelte';
	import { isActive, isExactActive } from '$lib/utils/navigation';

	// Get the current pathname - use $derived for Svelte 5 reactivity
	let currentPath = $derived(page.url.pathname);
</script>

<nav class="bg-surface-200 dark:bg-surface-700 shadow-md">
	<div class="max-w-7xl mx-auto px-4">
		<div class="flex items-center justify-between h-14">
			<!-- Left Navigation -->
			<div class="flex items-center gap-1">
				<a
					href="/game"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isExactActive(
						currentPath,
						'/game'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<Home size={16} />
						<span>Overview</span>
					</div>
				</a>
				<a
					href="/game/settlements"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isActive(
						currentPath,
						'/game/settlements'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<Building2 size={16} />
						<span>Settlements</span>
					</div>
				</a>
				<a
					href="/game/map"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isExactActive(
						currentPath,
						'/game/map'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<Map size={16} />
						<span>Map</span>
					</div>
				</a>
				<a
					href="/game/wardens"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isExactActive(
						currentPath,
						'/game/wardens'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<Shield size={16} />
						<span>Wardens</span>
					</div>
				</a>
			</div>

			<!-- Right Navigation -->
			<div class="flex items-center gap-1">
				<a
					href="/game/profile"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isExactActive(
						currentPath,
						'/game/profile'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<User size={16} />
						<span>Profile</span>
					</div>
				</a>
				<a
					href="/game/history"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isExactActive(
						currentPath,
						'/game/history'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<History size={16} />
						<span>History</span>
					</div>
				</a>
				<a
					href="/game/messages"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isExactActive(
						currentPath,
						'/game/messages'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<Mail size={16} />
						<span>Messages</span>
					</div>
				</a>
				<a
					href="/game/guild"
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {isExactActive(
						currentPath,
						'/game/guild'
					)
						? 'bg-primary-500 text-white'
						: 'text-surface-900 dark:text-surface-100 hover:bg-surface-300 dark:hover:bg-surface-600'}"
				>
					<div class="flex items-center gap-2">
						<Users size={16} />
						<span>Guild</span>
					</div>
				</a>
			</div>
		</div>
	</div>
</nav>
