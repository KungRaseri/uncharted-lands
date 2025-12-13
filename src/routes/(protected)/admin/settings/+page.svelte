<script lang="ts">
	import {
		Settings,
		Shield,
		Building2,
		Layers,
		Database,
		Globe,
		ChevronRight
	} from 'lucide-svelte';

	interface SettingSection {
		title: string;
		description: string;
		icon: any;
		href: string;
		color: string;
	}

	const sections: SettingSection[] = [
		{
			title: 'Roles & Permissions',
			description: 'Manage user roles and access control',
			icon: Shield,
			href: '/admin/settings/roles',
			color: 'primary'
		},
		{
			title: 'Structure Templates',
			description: 'Configure available buildings and extractors',
			icon: Building2,
			href: '/admin/settings/structures',
			color: 'secondary'
		},
		{
			title: 'Resource Types',
			description: 'Manage resource definitions and properties',
			icon: Layers,
			href: '/admin/settings/resources',
			color: 'tertiary'
		},
		{
			title: 'Game Configuration',
			description: 'Global game settings and parameters',
			icon: Database,
			href: '/admin/settings/game',
			color: 'success'
		},
		{
			title: 'World Generation',
			description: 'Default world generation parameters',
			icon: Globe,
			href: '/admin/settings/world-generation',
			color: 'warning'
		}
	];

	function getIconColorClass(color: string): string {
		return `text-${color}-500`;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-4">
			<div class="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
				<Settings size={32} class="text-primary-500" />
			</div>
			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">Settings & Configuration</h1>
				<p class="text-surface-600 dark:text-surface-400">
					Manage game data, roles, structures, and system configuration
				</p>
			</div>
		</div>
	</div>

	<!-- Settings Sections -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		{#each sections as section}
			<a
				href={section.href}
				class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-surface-500 transition-all group"
			>
				<div class="flex items-start gap-4">
					<div
						class="w-12 h-12 rounded-lg bg-{section.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"
					>
						<svelte:component
							this={section.icon}
							size={24}
							class={getIconColorClass(section.color)}
						/>
					</div>
					<div class="flex-1">
						<h3
							class="text-xl font-bold mb-1 group-hover:text-{section.color}-500 transition-colors"
						>
							{section.title}
						</h3>
						<p class="text-sm text-surface-600 dark:text-surface-400">
							{section.description}
						</p>
					</div>
					<ChevronRight
						size={20}
						class="text-surface-400 group-hover:text-{section.color}-500 group-hover:translate-x-1 transition-all"
					/>
				</div>
			</a>
		{/each}
	</div>

	<!-- Quick Info -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4">About Settings</h2>
		<div class="space-y-3 text-sm text-surface-600 dark:text-surface-400">
			<p>
				<strong class="text-surface-900 dark:text-surface-100">⚠️ Important:</strong> Changes to settings
				may affect existing game data and player experience. Always review changes carefully before saving.
			</p>
			<p>
				<strong class="text-surface-900 dark:text-surface-100">🔒 Permissions:</strong> Only administrators
				can access and modify system settings.
			</p>
			<p>
				<strong class="text-surface-900 dark:text-surface-100">📝 Change Log:</strong> All configuration
				changes are logged for audit purposes.
			</p>
		</div>
	</div>
</div>
