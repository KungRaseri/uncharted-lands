<script lang="ts">
	/**
	 * Layout Preset Selector Component
	 *
	 * Dropdown selector for dashboard layout presets:
	 * - Default: Balanced general-purpose layout
	 * - Planning Mode: Focus on construction and resources
	 * - Disaster Response: Focus on alerts and population
	 * - Mobile Optimized: Collapsed panels for mobile
	 */

	interface Props {
		currentPreset: string;
		onPresetChange: (presetName: string) => void;
	}

	let { currentPreset, onPresetChange }: Props = $props();

	// Available presets with metadata
	const PRESETS = [
		{
			value: 'Default',
			label: 'Default',
			description: 'Balanced layout for general gameplay',
			icon: '⚖️'
		},
		{
			value: 'Planning Mode',
			label: 'Planning Mode',
			description: 'Focus on construction and resource management',
			icon: '📐'
		},
		{
			value: 'Disaster Response',
			label: 'Disaster Response',
			description: 'Prioritize alerts and population safety',
			icon: '🚨'
		},
		{
			value: 'Mobile Optimized',
			label: 'Mobile Optimized',
			description: 'Compact layout with collapsed panels',
			icon: '📱'
		}
	];

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onPresetChange(target.value);
	}
</script>

<div class="flex flex-col gap-2">
	<label for="layout-preset" class="sr-only"> Select dashboard layout preset </label>

	<select
		id="layout-preset"
		value={currentPreset}
		onchange={handleChange}
		class="w-full px-4 py-3 text-[0.9375rem] border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 cursor-pointer transition-all duration-200 min-h-11 hover:border-primary-400 dark:hover:border-primary-500 focus-visible:outline-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 focus-visible:outline-offset-2 focus-visible:border-primary-500 dark:focus-visible:border-primary-400"
		aria-label="Dashboard layout preset"
	>
		{#each PRESETS as preset (preset.value)}
			<option value={preset.value}>
				{preset.icon}
				{preset.label}
			</option>
		{/each}
	</select>

	<!-- Description of current preset -->
	{#each PRESETS as preset (preset.value)}
		{#if preset.value === currentPreset}
			<p class="text-sm text-surface-600 dark:text-surface-400 m-0 leading-relaxed">
				{preset.description}
			</p>
		{/if}
	{/each}
</div>
