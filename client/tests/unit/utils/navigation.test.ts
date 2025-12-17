import { describe, it, expect } from 'vitest';
import { isActive, isExactActive, isActiveExcluding } from '../../../src/lib/utils/navigation';

describe('Navigation Utilities', () => {
	describe('isActive', () => {
		it('should return true for exact match', () => {
			expect(isActive('/game', '/game')).toBe(true);
			expect(isActive('/game/settlements', '/game/settlements')).toBe(true);
		});

		it('should return true for sub-routes', () => {
			expect(isActive('/game/settlements/123', '/game/settlements')).toBe(true);
			expect(isActive('/game/map/region/1', '/game/map')).toBe(true);
		});

		it('should return false for non-matching routes', () => {
			expect(isActive('/game', '/admin')).toBe(false);
			expect(isActive('/game/settlements', '/game/map')).toBe(false);
		});

		it('should return false for partial matches without trailing slash', () => {
			// '/gametest' should not match '/game'
			expect(isActive('/gametest', '/game')).toBe(false);
			expect(isActive('/games', '/game')).toBe(false);
		});

		it('should handle root path', () => {
			expect(isActive('/', '/')).toBe(true);
			// /game does NOT start with "/" + "/" (which would be "//")
			expect(isActive('/game', '/')).toBe(false);
		});
		it('should be case-sensitive', () => {
			expect(isActive('/Game', '/game')).toBe(false);
			expect(isActive('/game', '/Game')).toBe(false);
		});
	});

	describe('isExactActive', () => {
		it('should return true only for exact matches', () => {
			expect(isExactActive('/game', '/game')).toBe(true);
			expect(isExactActive('/game/settlements', '/game/settlements')).toBe(true);
		});

		it('should return false for sub-routes', () => {
			expect(isExactActive('/game/settlements', '/game')).toBe(false);
			expect(isExactActive('/game/map/region/1', '/game/map')).toBe(false);
		});

		it('should return false for non-matching routes', () => {
			expect(isExactActive('/game', '/admin')).toBe(false);
		});

		it('should handle root path', () => {
			expect(isExactActive('/', '/')).toBe(true);
			expect(isExactActive('/game', '/')).toBe(false);
		});
	});

	describe('isActiveExcluding', () => {
		it('should return true when active and not excluded', () => {
			expect(isActiveExcluding('/game', '/game', ['/game/settlements', '/game/map'])).toBe(
				true
			);
		});

		it('should return false when path matches excluded route', () => {
			expect(isActiveExcluding('/game/settlements', '/game', ['/game/settlements'])).toBe(
				false
			);

			expect(isActiveExcluding('/game/settlements/123', '/game', ['/game/settlements'])).toBe(
				false
			);
		});

		it('should return false when not active at all', () => {
			expect(isActiveExcluding('/admin', '/game', ['/game/settlements'])).toBe(false);
		});

		it('should handle multiple exclusions', () => {
			const excludes = ['/game/settlements', '/game/map', '/game/wardens'];

			expect(isActiveExcluding('/game', '/game', excludes)).toBe(true);
			expect(isActiveExcluding('/game/profile', '/game', excludes)).toBe(true);
			expect(isActiveExcluding('/game/settlements', '/game', excludes)).toBe(false);
			expect(isActiveExcluding('/game/map', '/game', excludes)).toBe(false);
			expect(isActiveExcluding('/game/wardens/123', '/game', excludes)).toBe(false);
		});

		it('should handle empty exclusion list', () => {
			expect(isActiveExcluding('/game/settlements', '/game', [])).toBe(true);
		});
	});
});
