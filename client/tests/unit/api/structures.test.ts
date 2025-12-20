import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	fetchStructureMetadata,
	getStructureMetadata,
	canBuildStructure,
	type StructureMetadata
} from '../../../src/lib/api/structures';

// Import MODIFIER_NAMES from shared constants
// TODO: Move to shared package when refactoring (see BLOCKER-3 docs)
const MODIFIER_NAMES = {
	POPULATION_CAPACITY: 'population_capacity',
	FOOD_PRODUCTION: 'food_production',
	STORAGE_CAPACITY: 'storage_capacity'
} as const;

describe('Structures API Wrapper', () => {
	// Mock fetch function
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockFetch = vi.fn();
	});

	describe('fetchStructureMetadata', () => {
		describe('Success Cases', () => {
			it('should fetch and return valid structure metadata array', async () => {
				const mockData: StructureMetadata[] = [
					{
						id: 'FARM',
						name: 'Farm',
						displayName: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 10, ore: 0 },
						modifiers: [
							{
								id: 'test_modifier_linear_food_production',
								type: 'LINEAR',
								name: MODIFIER_NAMES.FOOD_PRODUCTION,
								description: 'Increases food production',
								value: 10
							}
						],
						prerequisites: [],
						constructionTime: 300,
						populationRequired: 2
					},
					{
						id: 'HOUSE',
						name: 'House',
						displayName: 'House',
						description: 'Provides housing',
						category: 'BUILDING',
						type: 'HOUSE',
						costs: { food: 0, water: 0, wood: 50, stone: 20, ore: 0 },
						modifiers: [
							{
								id: 'test_modifier_linear_population_capacity',
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Provides housing for population',
								value: 5
							}
						],
						prerequisites: [],
						constructionTime: 600,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: mockData })
				});

				const result = await fetchStructureMetadata(mockFetch as any);

				expect(result).toEqual(mockData);
				expect(mockFetch).toHaveBeenCalledWith('/api/structures/metadata', {
					credentials: 'include'
				});
			});

			it('should include credentials in fetch request', async () => {
				const mockData: StructureMetadata[] = [
					{
						id: 'FARM',
						name: 'Farm',
						displayName: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0 },
						modifiers: [
							{
								id: 'test_modifier_linear_population_capacity',
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Increases production',
								value: 10
							}
						],
						prerequisites: [],
						constructionTime: 0,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: mockData })
				});

				await fetchStructureMetadata(mockFetch as any);

				expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
					credentials: 'include'
				});
			});

			it('should parse JSON response correctly', async () => {
				const mockData: StructureMetadata[] = [
					{
						id: 'TEST',
						name: 'Test Structure',
						displayName: 'Test Structure',
						description: 'Test',
						category: 'BUILDING',
						type: 'TEST',
						costs: { food: 0, water: 0, wood: 0, stone: 0, ore: 0 },
						modifiers: [
							{
								id: 'test_modifier_linear',
								type: 'LINEAR',
								name: 'Test Modifier',
								description: 'Test description',
								value: 1
							}
						],
						prerequisites: [{ structureId: 'PREREQ1', minimumLevel: 1 }],
						constructionTime: 0,
						populationRequired: 0
					}
				];

				const mockJson = vi.fn().mockResolvedValue({ success: true, data: mockData });
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: mockJson as any
				});

				const result = await fetchStructureMetadata(mockFetch as any);

				expect(mockJson).toHaveBeenCalled();
				expect(result).toEqual(mockData);
			});
		});

		describe('Validation Cases - Architectural Decisions', () => {
			it('should throw TypeError if response.data is not an array', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: 'not an array' })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid structures response: expected array'
				);
			});

			it('should throw Error if structure missing required field: id', async () => {
				const invalidData = [
					{
						// Missing id
						name: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0 },
						modifiers: [
							{
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Increases production',
								value: 10
							}
						],
						prerequisites: [],
						constructionTime: 0,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: invalidData })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid structure data: missing required fields'
				);
			});

			it('should throw Error if structure missing required field: name', async () => {
				const invalidData = [
					{
						id: 'FARM',
						// Missing name
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0 },
						modifiers: [
							{
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Increases production',
								value: 10
							}
						],
						prerequisites: [],
						constructionTime: 0,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: invalidData })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid structure data: missing required fields'
				);
			});

			it('should throw Error if structure missing required field: modifiers', async () => {
				const invalidData = [
					{
						id: 'FARM',
						name: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0 },
						// Missing modifiers
						prerequisites: [],
						constructionTime: 0,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: invalidData })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid structure data: missing required fields'
				);
			});

			it('should throw Error if modifier missing type field (Decision 1: Dynamic Calculation)', async () => {
				const invalidData = [
					{
						id: 'FARM',
						name: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0 },
						modifiers: [
							{ value: 10 } // Missing 'type' field - violates Decision 1
						],
						prerequisites: [],
						constructionTime: 0,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: invalidData })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					"Invalid modifier: missing 'type' field (required by Decision 1)"
				);
			});

			it('should throw Error if deprecated field present: area (Decision 2)', async () => {
				const invalidData = [
					{
						id: 'FARM',
						name: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0, area: 10 },
						modifiers: [
							{
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Increases production',
								value: 10
							}
						],
						prerequisites: [] // Deprecated field
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: invalidData })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid structure: contains deprecated area/solar/wind fields (Decision 2)'
				);
			});

			it('should throw Error if deprecated field present: solar (Decision 2)', async () => {
				const invalidData = [
					{
						id: 'FARM',
						name: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0, solar: 5 },
						modifiers: [
							{
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Increases production',
								value: 10
							}
						],
						prerequisites: [] // Deprecated field
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: invalidData })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid structure: contains deprecated area/solar/wind fields (Decision 2)'
				);
			});

			it('should throw Error if deprecated field present: wind (Decision 2)', async () => {
				const invalidData = [
					{
						id: 'FARM',
						name: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0, wind: 3 },
						modifiers: [
							{
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Increases production',
								value: 10
							}
						],
						prerequisites: [] // Deprecated field moved to costs
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: invalidData })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid structure: contains deprecated area/solar/wind fields (Decision 2)'
				);
			});
		});

		describe('Error Cases', () => {
			it('should throw Error on network failure', async () => {
				mockFetch.mockRejectedValueOnce(new Error('Network error'));

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Network error'
				);
			});

			it('should throw Error on non-200 response status', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 500,
					statusText: 'Internal Server Error',
					json: async () => ({ error: 'Server error' })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'API request failed: 500 Internal Server Error'
				);
			});

			it('should throw Error on 404 response', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: 'Not Found',
					json: async () => ({ error: 'Not found' })
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'API request failed: 404 Not Found'
				);
			});

			it('should handle JSON parse errors', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => {
						throw new Error('Invalid JSON');
					}
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Invalid JSON'
				);
			});

			it('should throw Error if response missing data field', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({}) // Missing 'success' field
				});

				await expect(fetchStructureMetadata(mockFetch as any)).rejects.toThrow(
					'Unknown error'
				);
			});
		});
	});

	describe('getStructureMetadata', () => {
		it('should return data from fetchStructureMetadata on success', async () => {
			const mockData: StructureMetadata[] = [
				{
					id: 'FARM',
					name: 'Farm',
					displayName: 'Farm',
					description: 'Produces food',
					category: 'EXTRACTOR',
					type: 'FARM',
					costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0 },
					modifiers: [
						{
							id: 'test_modifier_linear_population_capacity',
							type: 'LINEAR',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: 'Increases production',
							value: 10
						}
					],
					prerequisites: [],
					constructionTime: 0,
					populationRequired: 0
				}
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ success: true, data: mockData })
			});

			const result = await getStructureMetadata('FARM', mockFetch as any);

			expect(result).toEqual(mockData[0]);
		});

		describe('getStructureMetadata', () => {
			it('should return structure if found by ID', async () => {
				const mockData: StructureMetadata[] = [
					{
						id: 'FARM',
						name: 'Farm',
						displayName: 'Farm',
						description: 'Produces food',
						category: 'EXTRACTOR',
						type: 'FARM',
						costs: { food: 0, water: 0, wood: 50, stone: 20, ore: 10 },
						modifiers: [
							{
								id: 'test_modifier_linear_food_production',	
								type: 'LINEAR',
								name: MODIFIER_NAMES.FOOD_PRODUCTION,
								description: 'Increases food',
								value: 10
							}
						],
						prerequisites: [],
						constructionTime: 180,
						populationRequired: 2
					},
					{
						id: 'HOUSE',
						name: 'House',
						displayName: 'House',
						description: 'Provides housing',
						category: 'BUILDING',
						type: 'HOUSE',
						costs: { food: 0, water: 0, wood: 30, stone: 10, ore: 0 },
						modifiers: [
							{
								id: 'test_modifier_linear_population_capacity',
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Adds capacity',
								value: 5
							}
						],
						prerequisites: [],
						constructionTime: 600,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: mockData })
				});

				const result = await getStructureMetadata('FARM', mockFetch as any);

				expect(result).toBeDefined();
				expect(result?.id).toBe('FARM');
			});

			it('should return undefined if structure not found', async () => {
				const mockData: StructureMetadata[] = [
					{
						id: 'HOUSE',
						name: 'House',
						displayName: 'House',
						description: 'Provides housing',
						category: 'BUILDING',
						type: 'HOUSE',
						costs: { food: 0, water: 0, wood: 30, stone: 10, ore: 0 },
						modifiers: [
							{
								id: 'test_modifier_linear_population_capacity',	
								type: 'LINEAR',
								name: MODIFIER_NAMES.POPULATION_CAPACITY,
								description: 'Adds capacity',
								value: 5
							}
						],
						prerequisites: [],
						constructionTime: 600,
						populationRequired: 0
					}
				];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true, data: mockData })
				});

				const result = await getStructureMetadata('FARM', mockFetch as any);

				expect(result).toBeUndefined();
			});

			it('should throw error on network failure', async () => {
				mockFetch.mockRejectedValueOnce(new Error('Network error'));

				await expect(getStructureMetadata('FARM', mockFetch as any)).rejects.toThrow(
					'Network error'
				);
			});

			it('should throw error on non-200 response', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 500,
					statusText: 'Internal Server Error',
					json: async () => ({ error: 'Server error' })
				});

				await expect(getStructureMetadata('FARM', mockFetch as any)).rejects.toThrow(
					'API request failed: 500 Internal Server Error'
				);
			});
		});

		describe('canBuildStructure', () => {
			it('should return true when resources sufficient for all costs', () => {
				const structure: StructureMetadata = {
					id: 'FARM',
					name: 'Farm',
					displayName: 'Farm',
					description: 'Produces food',
					category: 'EXTRACTOR',
					type: 'FARM',
					costs: { food: 0, water: 0, wood: 50, stone: 20, ore: 10 },
					modifiers: [
						{
							id: 'test_modifier_linear_production',
							type: 'LINEAR',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: 'Increases production',
							value: 10
						}
					],
					prerequisites: [],
					constructionTime: 0,
					populationRequired: 0
				};

				const resources = {
					food: 100,
					water: 100,
					wood: 50,
					stone: 30,
					ore: 10
				};

				const result = canBuildStructure(structure, resources);

				expect(result.canBuild).toBe(true);
			});

			it('should return true when resources exactly match costs', () => {
				const structure: StructureMetadata = {
					id: 'FARM',
					name: 'Farm',
					displayName: 'Farm',
					description: 'Produces food',
					category: 'EXTRACTOR',
					type: 'FARM',
					costs: { food: 0, water: 0, wood: 50, stone: 20, ore: 0 },
					modifiers: [
						{
							id: 'test_modifier_linear_production',
							type: 'LINEAR',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: 'Increases production',
							value: 10
						}
					],
					prerequisites: [],
					constructionTime: 0,
					populationRequired: 0
				};

				const resources = {
					food: 0,
					water: 0,
					wood: 50,
					stone: 20,
					ore: 0
				};

				const result = canBuildStructure(structure, resources);

				expect(result.canBuild).toBe(true);
			});

			it('should return false when any resource insufficient', () => {
				const structure: StructureMetadata = {
					id: 'FARM',
					name: 'Farm',
					displayName: 'Farm',
					description: 'Produces food',
					category: 'EXTRACTOR',
					type: 'FARM',
					costs: { food: 0, water: 0, wood: 50, stone: 20, ore: 10 },
					modifiers: [
						{
							id: 'test_modifier_linear_production',
							type: 'LINEAR',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: 'Increases production',
							value: 10
						}
					],
					prerequisites: [],
					constructionTime: 0,
					populationRequired: 0
				};

				const resources = {
					food: 100,
					water: 100,
					wood: 50,
					stone: 30,
					ore: 3 // Insufficient ore (need 5)
				};

				const result = canBuildStructure(structure, resources);

				expect(result.canBuild).toBe(false);
			});

			it('should return false when wood insufficient', () => {
				const structure: StructureMetadata = {
					id: 'FARM',
					name: 'Farm',
					displayName: 'Farm',
					description: 'Produces food',
					category: 'EXTRACTOR',
					type: 'FARM',
					costs: { food: 0, water: 0, wood: 50, stone: 20, ore: 0 },
					modifiers: [
						{
							id: 'test_modifier_linear_production',
							type: 'LINEAR',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: 'Increases production',
							value: 10
						}
					],
					prerequisites: [],
					constructionTime: 0,
					populationRequired: 0
				};

				const resources = {
					food: 100,
					water: 100,
					wood: 15, // Insufficient wood (need 20)
					stone: 30,
					ore: 10
				};

				const result = canBuildStructure(structure, resources);

				expect(result.canBuild).toBe(false);
			});

			it('should use structure.costs field (not structure.requirements)', () => {
				const structure: StructureMetadata = {
					id: 'FARM',
					name: 'Farm',
					displayName: 'Farm',
					description: 'Produces food',
					category: 'EXTRACTOR',
					type: 'FARM',
					costs: { food: 0, water: 0, wood: 20, stone: 0, ore: 0 }, // Uses 'costs' field
					modifiers: [
						{
							id: 'test_modifier_linear_production',
							type: 'LINEAR',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: 'Increases production',
							value: 10
						}
					],
					prerequisites: [],
					constructionTime: 0,
					populationRequired: 0
				};

				const resources = {
					food: 0,
					water: 0,
					wood: 25,
					stone: 0,
					ore: 0
				};

				const result = canBuildStructure(structure, resources);

				expect(result.canBuild).toBe(true);
			});

			it('should return true when structure has no costs', () => {
				const structure: StructureMetadata = {
					id: 'FREE_STRUCTURE',
					name: 'Free Structure',
					displayName: 'Free Structure',
					description: 'No costs',
					category: 'BUILDING',
					type: 'FREE',
					costs: { food: 0, water: 0, wood: 0, stone: 0, ore: 0 }, // No costs
					modifiers: [
						{
							id: 'test_modifier_linear',
							type: 'LINEAR',
							name: 'Test Modifier',
							description: 'Test description',
							value: 1
						}
					],
					prerequisites: [],
					constructionTime: 0,
					populationRequired: 0
				};

				const resources = {
					food: 0,
					water: 0,
					wood: 0,
					stone: 0,
					ore: 0
				};

				const result = canBuildStructure(structure, resources);

				expect(result.canBuild).toBe(true);
			});
		});
	});
});
