/**
 * Navigation utility functions
 * Extracted from Svelte components for testability
 */

/**
 * Check if a given href matches the current pathname
 * @param currentPath - The current pathname (e.g., from page.url.pathname)
 * @param href - The href to check against
 * @returns true if the current path matches or starts with the href
 */
export function isActive(currentPath: string, href: string): boolean {
	return currentPath === href || currentPath.startsWith(href + '/');
}

/**
 * Check if path is exactly at the href (not a sub-route)
 * @param currentPath - The current pathname
 * @param href - The href to check against
 * @returns true if the current path is exactly the href
 */
export function isExactActive(currentPath: string, href: string): boolean {
	return currentPath === href;
}

/**
 * Check if path is within a section but not other specific routes
 * Useful for complex navigation where some routes should not trigger parent active state
 * @param currentPath - The current pathname
 * @param href - The base href
 * @param excludePaths - Array of paths to exclude from active check
 * @returns true if active but not in excluded paths
 */
export function isActiveExcluding(
	currentPath: string,
	href: string,
	excludePaths: string[]
): boolean {
	const baseActive = isActive(currentPath, href);
	const isExcluded = excludePaths.some((path) => isActive(currentPath, path));
	return baseActive && !isExcluded;
}
