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

<div class="preset-selector">
	<label for="layout-preset" class="sr-only"> Select dashboard layout preset </label>

	<select
		id="layout-preset"
		value={currentPreset}
		onchange={handleChange}
		class="preset-select"
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
			<p class="preset-description">
				{preset.description}
			</p>
		{/if}
	{/each}
</div>

<style>
	.preset-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Screen Reader Only class */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.preset-select {
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 0.9375rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 0.5rem;
		background: var(--color-surface-primary, #ffffff);
		color: var(--color-text-primary, #1a1a1a);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 44px; /* Touch target */
	}

	.preset-select:hover {
		border-color: var(--color-primary-400, #60a5fa);
	}

	.preset-select:focus {
		outline: 2px solid var(--color-primary-500, #3b82f6);
		outline-offset: 2px;
		border-color: var(--color-primary-500, #3b82f6);
	}

	.preset-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #666);
		margin: 0;
		line-height: 1.5;
	}

	/* Dark Mode */
	:global(.dark) .preset-select {
		background: var(--color-surface-primary-dark, #1a1a1a);
		color: var(--color-text-primary-dark, #f5f5f5);
		border-color: var(--color-border-dark, #3a3a3a);
	}

	:global(.dark) .preset-select:hover {
		border-color: var(--color-primary-500, #3b82f6);
	}

	:global(.dark) .preset-description {
		color: var(--color-text-secondary-dark, #a0a0a0);
	}
</style>
