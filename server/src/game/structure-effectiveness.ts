/**
 * Structure Effectiveness Calculator
 *
 * Calculates production effectiveness multiplier based on structure health.
 * Uses piecewise linear interpolation between defined breakpoints per GDD Section 6.6.
 *
 * Health Breakpoints (GDD Specification):
 * - 95-100%: 1.00 (100%) - Pristine
 * - 80-94%:  0.95 (95%)  - Excellent Condition
 * - 60-79%:  0.85 (85%)  - Good Condition
 * - 40-59%:  0.70 (70%)  - Damaged
 * - 20-39%:  0.50 (50%)  - Poor Condition
 * - 1-19%:   0.10 (10%)  - Critical
 * - 0%:      0.00 (0%)   - Destroyed
 *
 * @module structure-effectiveness
 */

/**
 * Color codes for health states
 */
export type HealthColor = 'green' | 'yellow' | 'orange' | 'red' | 'gray';

/**
 * Health breakpoint defining health range and corresponding effectiveness
 */
interface HealthBreakpoint {
	/** Minimum health for this breakpoint (inclusive) */
	minHealth: number;
	/** Maximum health for this breakpoint (inclusive) */
	maxHealth: number;
	/** Effectiveness multiplier at minimum health */
	minEffectiveness: number;
	/** Effectiveness multiplier at maximum health */
	maxEffectiveness: number;
	/** Human-readable label for this health state */
	label: string;
	/** Color code for UI display */
	color: HealthColor;
}

/**
 * Ordered breakpoints for health → effectiveness mapping
 * Must be sorted by minHealth ascending for binary search
 */
const HEALTH_BREAKPOINTS: HealthBreakpoint[] = [
	{
		minHealth: 0,
		maxHealth: 0,
		minEffectiveness: 0,
		maxEffectiveness: 0,
		label: 'Destroyed',
		color: 'gray',
	},
	{
		minHealth: 1,
		maxHealth: 19,
		minEffectiveness: 0.1,
		maxEffectiveness: 0.1,
		label: 'Critical',
		color: 'red',
	},
	{
		minHealth: 20,
		maxHealth: 39,
		minEffectiveness: 0.5,
		maxEffectiveness: 0.5,
		label: 'Poor Condition',
		color: 'red',
	},
	{
		minHealth: 40,
		maxHealth: 59,
		minEffectiveness: 0.7,
		maxEffectiveness: 0.7,
		label: 'Damaged',
		color: 'orange',
	},
	{
		minHealth: 60,
		maxHealth: 79,
		minEffectiveness: 0.85,
		maxEffectiveness: 0.85,
		label: 'Good Condition',
		color: 'yellow',
	},
	{
		minHealth: 80,
		maxHealth: 94,
		minEffectiveness: 0.95,
		maxEffectiveness: 0.95,
		label: 'Excellent Condition',
		color: 'green',
	},
	{
		minHealth: 95,
		maxHealth: 100,
		minEffectiveness: 1,
		maxEffectiveness: 1,
		label: 'Pristine',
		color: 'green',
	},
];

/**
 * Calculate production effectiveness multiplier based on structure health
 *
 * Uses piecewise linear interpolation between defined breakpoints.
 * For exact breakpoint values, returns exact effectiveness.
 * Between breakpoints, linearly interpolates.
 *
 * @param health - Structure health (0-100). Can be null/undefined (treated as 100).
 * @returns Effectiveness multiplier (0.0-1.0)
 *
 * @example
 * ```typescript
 * getEffectiveness(100);  // 1.00 (pristine)
 * getEffectiveness(50);   // 0.70 (damaged)
 * getEffectiveness(0);    // 0.00 (destroyed)
 * getEffectiveness(null); // 1.00 (treats null as full health)
 * ```
 */
export function getEffectiveness(health: number | null | undefined): number {
	// Handle null/undefined as full health
	if (health === null || health === undefined) {
		return 1;
	}

	// Clamp health to valid range [0, 100]
	const clampedHealth = Math.max(0, Math.min(100, health));

	// Find the breakpoint that contains this health value
	for (const breakpoint of HEALTH_BREAKPOINTS) {
		if (clampedHealth >= breakpoint.minHealth && clampedHealth <= breakpoint.maxHealth) {
			// For single-value ranges (min === max), return exact effectiveness
			if (breakpoint.minHealth === breakpoint.maxHealth) {
				return breakpoint.minEffectiveness;
			}

			// For ranges, check if effectiveness is constant
			if (breakpoint.minEffectiveness === breakpoint.maxEffectiveness) {
				return breakpoint.minEffectiveness;
			}

			// Linear interpolation between min and max effectiveness
			const healthRange = breakpoint.maxHealth - breakpoint.minHealth;
			const effectivenessRange = breakpoint.maxEffectiveness - breakpoint.minEffectiveness;
			const healthOffset = clampedHealth - breakpoint.minHealth;
			const ratio = healthOffset / healthRange;

			return breakpoint.minEffectiveness + ratio * effectivenessRange;
		}
	}

	// Should never reach here if breakpoints are correctly defined
	// Fallback to 0 effectiveness for safety
	return 0;
}

/**
 * Get human-readable label for structure health state
 *
 * @param health - Structure health (0-100)
 * @returns Label string (e.g., "Pristine", "Damaged", "Critical")
 *
 * @example
 * ```typescript
 * getEffectivenessLabel(100); // "Pristine"
 * getEffectivenessLabel(50);  // "Damaged"
 * getEffectivenessLabel(10);  // "Critical"
 * getEffectivenessLabel(0);   // "Destroyed"
 * ```
 */
export function getEffectivenessLabel(health: number | null | undefined): string {
	// Handle null/undefined as full health
	if (health === null || health === undefined) {
		return 'Pristine';
	}

	// Clamp health to valid range
	const clampedHealth = Math.max(0, Math.min(100, health));

	// Find matching breakpoint
	for (const breakpoint of HEALTH_BREAKPOINTS) {
		if (clampedHealth >= breakpoint.minHealth && clampedHealth <= breakpoint.maxHealth) {
			return breakpoint.label;
		}
	}

	// Fallback (should never happen)
	return 'Unknown';
}

/**
 * Get color code for UI display based on structure health
 *
 * @param health - Structure health (0-100)
 * @returns Color name ('green' | 'yellow' | 'orange' | 'red' | 'gray')
 *
 * @example
 * ```typescript
 * getHealthColor(100); // 'green'
 * getHealthColor(50);  // 'orange'
 * getHealthColor(10);  // 'red'
 * getHealthColor(0);   // 'gray'
 * ```
 */
export function getHealthColor(health: number | null | undefined): HealthColor {
	// Handle null/undefined as full health
	if (health === null || health === undefined) {
		return 'green';
	}

	// Clamp health to valid range
	const clampedHealth = Math.max(0, Math.min(100, health));

	// Find matching breakpoint
	for (const breakpoint of HEALTH_BREAKPOINTS) {
		if (clampedHealth >= breakpoint.minHealth && clampedHealth <= breakpoint.maxHealth) {
			return breakpoint.color;
		}
	}

	// Fallback (should never happen)
	return 'gray';
}

/**
 * Get detailed effectiveness info for debugging/display
 *
 * @param health - Structure health (0-100)
 * @returns Object with effectiveness, label, and color
 *
 * @example
 * ```typescript
 * getEffectivenessInfo(75);
 * // {
 * //   health: 75,
 * //   effectiveness: 0.85,
 * //   label: "Good Condition",
 * //   color: "yellow",
 * //   productionPenalty: 15 // percentage
 * // }
 * ```
 */
export function getEffectivenessInfo(health: number | null | undefined): {
	health: number;
	effectiveness: number;
	label: string;
	color: HealthColor;
	productionPenalty: number;
} {
	const actualHealth = health ?? 100;
	const effectiveness = getEffectiveness(health);
	const label = getEffectivenessLabel(health);
	const color = getHealthColor(health);
	const productionPenalty = Math.round((1 - effectiveness) * 100);

	return {
		health: actualHealth,
		effectiveness,
		label,
		color,
		productionPenalty,
	};
}
