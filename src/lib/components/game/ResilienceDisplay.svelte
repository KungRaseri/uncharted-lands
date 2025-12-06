<!--
  Resilience Display Component
  
  Shows settlement resilience score (0-100) with:
  - Tier labels (Vulnerable, Unprepared, Prepared, Resilient, Fortress)
  - Color-coded progress bar with gradient
  - Tooltip with contributing factors
  
  Uses native HTML title tooltips for simplicity.
-->
<script lang="ts">
	interface Props {
		resilience: number; // 0-100 score
		showTooltip?: boolean;
		contributingFactors?: {
			disastersSurvived: number;
			fullShelterCapacity: boolean;
			hospitalAvailable: boolean;
			reliefCenterAvailable: boolean;
			disasterCommandCenter: boolean;
			npcAllies: number;
			guildSupport: boolean;
			personalAlliances: number;
		};
	}

	let { resilience = 0, showTooltip = true, contributingFactors }: Props = $props();

	// Tier calculation
	const tier = $derived.by(() => {
		if (resilience >= 80) return 'FORTRESS';
		if (resilience >= 60) return 'RESILIENT';
		if (resilience >= 40) return 'PREPARED';
		if (resilience >= 20) return 'UNPREPARED';
		return 'VULNERABLE';
	});

	// Tier metadata
	const tierData = $derived.by(() => {
		switch (tier) {
			case 'FORTRESS':
				return {
					label: 'Fortress',
					description: 'Minimal impact from most disasters',
					color: 'text-success-400',
					bgColor: 'bg-success-400',
					gradientFrom: 'from-success-600',
					gradientTo: 'to-success-400'
				};
			case 'RESILIENT':
				return {
					label: 'Resilient',
					description: 'Strong disaster response capabilities',
					color: 'text-primary-400',
					bgColor: 'bg-primary-400',
					gradientFrom: 'from-primary-600',
					gradientTo: 'to-primary-400'
				};
			case 'PREPARED':
				return {
					label: 'Prepared',
					description: 'Can survive moderate disasters',
					color: 'text-tertiary-400',
					bgColor: 'bg-tertiary-400',
					gradientFrom: 'from-tertiary-600',
					gradientTo: 'to-tertiary-400'
				};
			case 'UNPREPARED':
				return {
					label: 'Unprepared',
					description: 'Significant impact expected',
					color: 'text-warning-400',
					bgColor: 'bg-warning-400',
					gradientFrom: 'from-warning-600',
					gradientTo: 'to-warning-400'
				};
			case 'VULNERABLE':
			default:
				return {
					label: 'Vulnerable',
					description: 'Disasters will devastate your settlement',
					color: 'text-error-400',
					bgColor: 'bg-error-400',
					gradientFrom: 'from-error-600',
					gradientTo: 'to-error-400'
				};
		}
	});

	// Progress bar width (clamped 0-100)
	const progressWidth = $derived(Math.max(0, Math.min(100, resilience)));

	// Build tooltip text from contributing factors
	const tooltipText = $derived.by(() => {
		if (!showTooltip) return '';

		let text = `Resilience: ${resilience}/100 - ${tierData.label}\n${tierData.description}\n`;

		if (contributingFactors) {
			const bonuses = factorBonuses;
			if (bonuses.length > 0) {
				text += '\n💪 Contributing Factors:\n';
				bonuses.forEach((b) => {
					text += `  ${b.label}: ${b.value} (${b.detail})\n`;
				});
			} else {
				text += '\n💡 Increase resilience by:\n';
				text += '  • Surviving disasters (+5 each)\n';
				text += '  • Building shelters and defenses\n';
				text += '  • Forming alliances (+5 each)\n';
				text += '  • Joining a guild (+10)\n';
			}
		}

		text += '\n✨ Benefits: Faster recovery, lower emigration,\n';
		text += '   casualty reduction, faster repairs';

		return text;
	});

	// Calculate contributing factor bonuses
	const factorBonuses = $derived.by(() => {
		if (!contributingFactors) return [];

		const bonuses = [];

		if (contributingFactors.disastersSurvived > 0) {
			bonuses.push({
				label: 'Disasters Survived',
				value: `+${contributingFactors.disastersSurvived * 5}`,
				detail: `${contributingFactors.disastersSurvived} disasters × 5 points`
			});
		}

		if (contributingFactors.fullShelterCapacity) {
			bonuses.push({
				label: 'Full Shelter Capacity',
				value: '+10',
				detail: '100% population can be sheltered'
			});
		}

		if (contributingFactors.hospitalAvailable) {
			bonuses.push({
				label: 'Hospital',
				value: '+10',
				detail: 'Medical facility available'
			});
		}

		if (contributingFactors.reliefCenterAvailable) {
			bonuses.push({
				label: 'Relief Center',
				value: '+5',
				detail: 'Emergency supplies distribution'
			});
		}

		if (contributingFactors.disasterCommandCenter) {
			bonuses.push({
				label: 'Disaster Command Center',
				value: '+15',
				detail: 'Coordinated disaster response'
			});
		}

		if (contributingFactors.npcAllies > 0) {
			bonuses.push({
				label: 'NPC Allies',
				value: `+${contributingFactors.npcAllies * 5}`,
				detail: `${contributingFactors.npcAllies} trusted NPCs × 5 points`
			});
		}

		if (contributingFactors.guildSupport) {
			bonuses.push({
				label: 'Guild Support',
				value: '+10',
				detail: 'Member of active guild'
			});
		}

		if (contributingFactors.personalAlliances > 0) {
			bonuses.push({
				label: 'Personal Alliances',
				value: `+${contributingFactors.personalAlliances * 5}`,
				detail: `${contributingFactors.personalAlliances} active allies × 5 points`
			});
		}

		return bonuses;
	});
</script>

<!-- Resilience Display -->
<div class="space-y-2">
	<!-- Header with Tier Label -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="text-sm font-semibold text-surface-300 dark:text-surface-400">Resilience</span>
			{#if showTooltip}
				<button
					type="button"
					class="shrink-0 flex items-center justify-center p-1 rounded-lg transition-colors hover:bg-surface-700 dark:hover:bg-surface-600 focus-visible:outline-3 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 focus-visible:outline-offset-2"
					title={tooltipText}
					aria-label="Show resilience details"
				>
					<span class="text-xs">ℹ️</span>
				</button>
			{/if}
		</div>
		<div class="flex items-baseline gap-2">
			<span class="text-2xl font-bold {tierData.color}">{resilience}</span>
			<span class="text-sm text-surface-400 dark:text-surface-500">/ 100</span>
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="relative h-3 bg-surface-700 dark:bg-surface-800 rounded-full overflow-hidden">
		<div
			class="h-full bg-gradient-to-r {tierData.gradientFrom} {tierData.gradientTo} transition-all duration-500 ease-out transform-gpu will-change-[width]"
			style:width="{progressWidth}%"
			role="progressbar"
			aria-valuenow={resilience}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="Resilience score"
		></div>
	</div>

	<!-- Tier Label -->
	<div class="flex items-center justify-between text-sm">
		<span class={tierData.color}>
			<span class="font-bold">{tierData.label}</span>
			<span class="text-surface-400 dark:text-surface-500 ml-2">{tierData.description}</span>
		</span>
	</div>
</div>
