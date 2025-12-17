<script lang="ts">
	interface Props {
		health: number; // 0-100 percentage
		size?: 'sm' | 'md' | 'lg';
		showLabel?: boolean;
	}

	let { health, size = 'md', showLabel = true }: Props = $props();

	// Health state colors and labels
	const healthStates = {
		pristine: { min: 95, color: 'bg-green-600', label: 'Pristine' },
		excellent: { min: 80, color: 'bg-green-500', label: 'Excellent' },
		good: { min: 60, color: 'bg-yellow-500', label: 'Good' },
		damaged: { min: 40, color: 'bg-orange-500', label: 'Damaged' },
		poor: { min: 20, color: 'bg-red-500', label: 'Poor' },
		critical: { min: 1, color: 'bg-purple-600', label: 'Critical' },
		destroyed: { min: 0, color: 'bg-gray-600', label: 'Destroyed' }
	};

	const currentState = $derived(() => {
		if (health >= 95) return healthStates.pristine;
		if (health >= 80) return healthStates.excellent;
		if (health >= 60) return healthStates.good;
		if (health >= 40) return healthStates.damaged;
		if (health >= 20) return healthStates.poor;
		if (health >= 1) return healthStates.critical;
		return healthStates.destroyed;
	});

	const heightClass = $derived(() => {
		switch (size) {
			case 'sm':
				return 'h-2';
			case 'lg':
				return 'h-6';
			default:
				return 'h-4';
		}
	});
</script>

<div class="w-full">
	{#if showLabel}
		<div class="flex justify-between items-center mb-1">
			<span class="text-xs font-medium">{currentState().label}</span>
			<span class="text-xs font-bold">{health}%</span>
		</div>
	{/if}

	<div class="w-full bg-surface-300-600-token rounded-full {heightClass()} overflow-hidden">
		<div
			class="{currentState().color} {heightClass()} rounded-full transition-all duration-500"
			style="width: {health}%"
			role="progressbar"
			aria-valuenow={health}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="Structure health"
		></div>
	</div>
</div>
