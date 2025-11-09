import { describe, it, expect } from 'vitest';
import { normalizeValue, chunks } from '../../../src/lib/game/world-generator';

describe('world-generator', () => {
	describe('normalizeValue', () => {
		it('should normalize value from [-1, 1] to [min, max]', () => {
			// Test with range [0, 100]
			expect(normalizeValue(0, 0, 100)).toBe(50);
			expect(normalizeValue(1, 0, 100)).toBe(100);
			expect(normalizeValue(-1, 0, 100)).toBe(0);
		});

		it('should handle negative ranges', () => {
			// Test with range [-50, 50]
			expect(normalizeValue(0, -50, 50)).toBe(0);
			expect(normalizeValue(1, -50, 50)).toBe(50);
			expect(normalizeValue(-1, -50, 50)).toBe(-50);
		});

		it('should handle range [0, 1]', () => {
			expect(normalizeValue(0, 0, 1)).toBe(0.5);
			expect(normalizeValue(1, 0, 1)).toBe(1);
			expect(normalizeValue(-1, 0, 1)).toBe(0);
		});

		it('should handle elevation range [0, 255]', () => {
			// Common use case for elevation maps
			expect(normalizeValue(0, 0, 255)).toBe(127.5);
			expect(normalizeValue(1, 0, 255)).toBe(255);
			expect(normalizeValue(-1, 0, 255)).toBe(0);
		});

		it('should handle intermediate values', () => {
			// Test with 0.5 (halfway between -1 and 1)
			expect(normalizeValue(0.5, 0, 100)).toBe(75);
			expect(normalizeValue(-0.5, 0, 100)).toBe(25);
		});

		it('should handle same min and max', () => {
			// When min === max, result should be that value
			expect(normalizeValue(0, 50, 50)).toBe(50);
			expect(normalizeValue(1, 50, 50)).toBe(50);
			expect(normalizeValue(-1, 50, 50)).toBe(50);
		});

		it('should handle inverted ranges (max < min)', () => {
			// When max < min, the formula still works mathematically
			expect(normalizeValue(0, 100, 0)).toBe(50);
			expect(normalizeValue(1, 100, 0)).toBe(0);
			expect(normalizeValue(-1, 100, 0)).toBe(100);
		});

		it('should handle decimal values', () => {
			expect(normalizeValue(0.25, 0, 100)).toBe(62.5);
			expect(normalizeValue(-0.75, 0, 100)).toBe(12.5);
		});

		it('should handle large ranges', () => {
			expect(normalizeValue(0, 0, 10000)).toBe(5000);
			expect(normalizeValue(1, 0, 10000)).toBe(10000);
			expect(normalizeValue(-1, 0, 10000)).toBe(0);
		});

		it('should handle small ranges', () => {
			expect(normalizeValue(0, 0, 0.1)).toBe(0.05);
			expect(normalizeValue(1, 0, 0.1)).toBe(0.1);
			expect(normalizeValue(-1, 0, 0.1)).toBe(0);
		});

		it('should handle zero as min or max', () => {
			expect(normalizeValue(0, -100, 0)).toBe(-50);
			expect(normalizeValue(0, 0, 100)).toBe(50);
		});

		it('should verify mathematical formula', () => {
			// Formula: value * (max - min) / 2 + (max + min) / 2
			const value = 0.3;
			const min = 10;
			const max = 90;
			
			const expected = value * (max - min) / 2 + (max + min) / 2;
			expect(normalizeValue(value, min, max)).toBe(expected);
		});

		it('should handle values outside [-1, 1] range', () => {
			// While noise typically returns [-1, 1], test edge cases
			expect(normalizeValue(2, 0, 100)).toBe(150);
			expect(normalizeValue(-2, 0, 100)).toBe(-50);
		});

		it('should handle negative min and max', () => {
			expect(normalizeValue(0, -100, -50)).toBe(-75);
			expect(normalizeValue(1, -100, -50)).toBe(-50);
			expect(normalizeValue(-1, -100, -50)).toBe(-100);
		});

		it('should be symmetric around zero', () => {
			// For symmetric ranges, opposite values should give symmetric results
			const result1 = normalizeValue(0.5, -100, 100);
			const result2 = normalizeValue(-0.5, -100, 100);
			
			expect(result1).toBe(50);
			expect(result2).toBe(-50);
			expect(Math.abs(result1)).toBe(Math.abs(result2));
		});

		it('should handle typical noise output to elevation conversion', () => {
			// Common pattern: noise [-1, 1] → elevation [0, 255]
			const lowNoise = -0.8; // Deep water
			const midNoise = 0;    // Sea level
			const highNoise = 0.9; // Mountain
			
			expect(normalizeValue(lowNoise, 0, 255)).toBe(25.5);
			expect(normalizeValue(midNoise, 0, 255)).toBe(127.5);
			expect(normalizeValue(highNoise, 0, 255)).toBe(242.25);
		});
	});

	describe('chunks', () => {
		it('should split 2x2 map into 1x1 chunks', () => {
			const heightMap = [
				[1, 2],
				[3, 4]
			];
			
			const result = chunks(heightMap, 1);
			
			expect(result.length).toBe(2); // 2 rows of chunks
			expect(result[0].length).toBe(2); // 2 chunks per row
			expect(result[0][0]).toEqual([[1]]);
			expect(result[0][1]).toEqual([[2]]);
			expect(result[1][0]).toEqual([[3]]);
			expect(result[1][1]).toEqual([[4]]);
		});

		it('should split 4x4 map into 2x2 chunks', () => {
			const heightMap = [
				[1, 2, 3, 4],
				[5, 6, 7, 8],
				[9, 10, 11, 12],
				[13, 14, 15, 16]
			];
			
			const result = chunks(heightMap, 2);
			
			expect(result.length).toBe(2); // 2 rows of chunks
			expect(result[0].length).toBe(2); // 2 chunks per row
			
			// Top-left chunk
			expect(result[0][0]).toEqual([
				[1, 2],
				[5, 6]
			]);
			
			// Top-right chunk
			expect(result[0][1]).toEqual([
				[3, 4],
				[7, 8]
			]);
			
			// Bottom-left chunk
			expect(result[1][0]).toEqual([
				[9, 10],
				[13, 14]
			]);
			
			// Bottom-right chunk
			expect(result[1][1]).toEqual([
				[11, 12],
				[15, 16]
			]);
		});

		it('should handle chunk size equal to map size', () => {
			const heightMap = [
				[1, 2],
				[3, 4]
			];
			
			const result = chunks(heightMap, 2);
			
			expect(result.length).toBe(1); // 1 row of chunks
			expect(result[0].length).toBe(1); // 1 chunk
			expect(result[0][0]).toEqual([
				[1, 2],
				[3, 4]
			]);
		});

		it('should handle chunk size larger than map size', () => {
			const heightMap = [
				[1, 2],
				[3, 4]
			];
			
			const result = chunks(heightMap, 10);
			
			expect(result.length).toBe(1); // 1 row of chunks
			expect(result[0].length).toBe(1); // 1 chunk
			expect(result[0][0]).toEqual([
				[1, 2],
				[3, 4]
			]);
		});

		it('should handle zero chunk size', () => {
			const heightMap = [
				[1, 2],
				[3, 4]
			];
			
			const result = chunks(heightMap, 0);
			
			expect(result).toEqual([]);
		});

		it('should handle non-evenly divisible dimensions', () => {
			const heightMap = [
				[1, 2, 3],
				[4, 5, 6],
				[7, 8, 9]
			];
			
			const result = chunks(heightMap, 2);
			
			expect(result.length).toBe(2); // 2 rows of chunks (3 / 2 = 1.5, rounded up)
			
			// First row of chunks
			expect(result[0][0]).toEqual([
				[1, 2],
				[4, 5]
			]);
			expect(result[0][1]).toEqual([
				[3],
				[6]
			]);
			
			// Second row of chunks (partial height)
			expect(result[1][0]).toEqual([
				[7, 8]
			]);
			expect(result[1][1]).toEqual([
				[9]
			]);
		});

		it('should handle typical world map size (100x100) with chunk size 10', () => {
			// Create a 100x100 map
			const heightMap: number[][] = [];
			for (let i = 0; i < 100; i++) {
				const row: number[] = [];
				for (let j = 0; j < 100; j++) {
					row.push(i * 100 + j); // Unique value for each cell
				}
				heightMap.push(row);
			}
			
			const result = chunks(heightMap, 10);
			
			// Should be 10x10 grid of chunks
			expect(result.length).toBe(10);
			expect(result[0].length).toBe(10);
			
			// Verify first chunk
			expect(result[0][0][0][0]).toBe(0); // Top-left of first chunk
			expect(result[0][0][9][9]).toBe(909); // Bottom-right of first chunk
			
			// Verify last chunk
			expect(result[9][9][0][0]).toBe(9090); // Top-left of last chunk
			expect(result[9][9][9][9]).toBe(9999); // Bottom-right of last chunk
		});

		it('should handle 1x1 map', () => {
			const heightMap = [[42]];
			
			const result = chunks(heightMap, 1);
			
			expect(result.length).toBe(1);
			expect(result[0].length).toBe(1);
			expect(result[0][0]).toEqual([[42]]);
		});

		it('should handle horizontal strip (1xN)', () => {
			const heightMap = [[1, 2, 3, 4, 5, 6]];
			
			const result = chunks(heightMap, 2);
			
			expect(result.length).toBe(1); // 1 row
			expect(result[0].length).toBe(3); // 3 chunks
			expect(result[0][0]).toEqual([[1, 2]]);
			expect(result[0][1]).toEqual([[3, 4]]);
			expect(result[0][2]).toEqual([[5, 6]]);
		});

		it('should handle vertical strip (Nx1)', () => {
			const heightMap = [[1], [2], [3], [4], [5], [6]];
			
			const result = chunks(heightMap, 2);
			
			expect(result.length).toBe(3); // 3 rows of chunks
			expect(result[0].length).toBe(1); // 1 chunk per row
			expect(result[0][0]).toEqual([[1], [2]]);
			expect(result[1][0]).toEqual([[3], [4]]);
			expect(result[2][0]).toEqual([[5], [6]]);
		});

		it('should preserve data types and values', () => {
			const heightMap = [
				[0.5, -1.2],
				[3.7, 0]
			];
			
			const result = chunks(heightMap, 1);
			
			expect(result[0][0]).toEqual([[0.5]]);
			expect(result[0][1]).toEqual([[-1.2]]);
			expect(result[1][0]).toEqual([[3.7]]);
			expect(result[1][1]).toEqual([[0]]);
		});
	});
});
