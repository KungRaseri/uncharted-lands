/**
 * Utility functions for formatting numbers in game contexts
 */

/**
 * Formats elevation values with consistent precision
 * @param elevation - Elevation value (-1 to 1)
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted elevation string
 */
export function formatElevation(elevation: number, decimals: number = 3): string {
	return elevation.toFixed(decimals);
}

/**
 * Formats temperature values with consistent precision
 * @param temperature - Temperature value
 * @param decimals - Number of decimal places (default: 3)
 * @param includeUnit - Whether to include unit symbol (default: false)
 * @returns Formatted temperature string
 */
export function formatTemperature(
	temperature: number,
	decimals: number = 3,
	includeUnit: boolean = false
): string {
	const formatted = temperature.toFixed(decimals);
	return includeUnit ? `${formatted}°C` : formatted;
}

/**
 * Formats precipitation values with consistent precision
 * @param precipitation - Precipitation value
 * @param decimals - Number of decimal places (default: 3)
 * @param includeUnit - Whether to include unit symbol (default: false)
 * @returns Formatted precipitation string
 */
export function formatPrecipitation(
	precipitation: number,
	decimals: number = 3,
	includeUnit: boolean = false
): string {
	const formatted = precipitation.toFixed(decimals);
	return includeUnit ? `${formatted}mm` : formatted;
}

/**
 * Formats area values (removes fractional parts)
 * @param area - Area value in square meters
 * @param includeUnit - Whether to include unit symbol (default: false)
 * @returns Formatted area string
 */
export function formatArea(area: number, includeUnit: boolean = false): string {
	const formatted = area.toFixed(0);
	return includeUnit ? `${formatted} m²` : formatted;
}

/**
 * Formats elevation as percentage (e.g., for display contexts where elevation is 0-1)
 * @param elevation - Elevation value (0 to 1)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string with % symbol
 */
export function formatElevationAsPercent(elevation: number, decimals: number = 1): string {
	return `${(elevation * 100).toFixed(decimals)}%`;
}

/**
 * Formats a range of values (e.g., "0.23 to 0.87")
 * @param min - Minimum value
 * @param max - Maximum value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted range string
 */
export function formatRange(min: number, max: number, decimals: number = 2): string {
	return `${min.toFixed(decimals)} to ${max.toFixed(decimals)}`;
}

/**
 * Formats storage resource amounts
 * @param amount - Resource amount
 * @returns Formatted resource amount (no decimals)
 */
export function formatResourceAmount(amount: number): string {
	return amount.toFixed(0);
}

/**
 * Formats solar or wind values with single decimal
 * @param value - Solar/wind value
 * @returns Formatted value with 1 decimal place
 */
export function formatEnergyValue(value: number): string {
	return value.toFixed(1);
}
