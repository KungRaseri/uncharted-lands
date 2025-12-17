<script lang="ts">
	import { Layers, Info } from 'lucide-svelte';
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a href="/admin/settings" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Settings</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">Resource Types</span>
	</div>

	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold flex items-center gap-2">
			<Layers size={28} />
			Resource Types
		</h1>
		<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
			Manage resource definitions and properties
		</p>
	</div>

	<!-- Coming Soon -->
	<div class="card preset-filled-surface-100-900 p-12 text-center">
		<div
			class="w-24 h-24 rounded-full bg-warning-500/10 flex items-center justify-center mx-auto mb-6"
		>
			<Info size={48} class="text-warning-500" />
		</div>
		<h2 class="text-2xl font-bold mb-3">Coming Soon</h2>
		<p class="text-surface-600 dark:text-surface-400 max-w-md mx-auto">
			Resource type management will be available in a future update. This will allow you to define
			custom resource types, set their properties, and configure how they interact with structures
			and settlements.
		</p>
	</div>
</div>
