<script lang="ts">
	import { Database, Info } from 'lucide-svelte';
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/settings"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Settings</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">Game Configuration</span>
	</div>

	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold flex items-center gap-2">
			<Database size={28} />
			Game Configuration
		</h1>
		<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
			Global game settings and parameters
		</p>
	</div>

	<!-- Coming Soon -->
	<div class="card preset-filled-surface-100-900 p-12 text-center">
		<div
			class="w-24 h-24 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-6"
		>
			<Info size={48} class="text-success-500" />
		</div>
		<h2 class="text-2xl font-bold mb-3">Coming Soon</h2>
		<p class="text-surface-600 dark:text-surface-400 max-w-md mx-auto">
			Game configuration management will be available in a future update. This will allow you
			to configure global game settings such as resource generation rates, population growth,
			combat parameters, and more.
		</p>
	</div>
</div>
