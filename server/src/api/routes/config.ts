import { Router } from 'express';
import { DEFAULT_GAME_CONFIG } from '../../config/game-config-data.js';
import { logger } from '../../utils/logger.js';

const router = Router();

/**
 * Server-side cache for production rates
 * Reduces config reads and improves response time
 */
interface ProductionRatesCache {
	data: {
		baseRates: Record<string, number>;
		fullConfig: Array<{
			resourceType: string;
			extractorType: string;
			baseRate: number;
		}>;
	};
	timestamp: number;
}

let productionRatesCache: ProductionRatesCache | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/config/production-rates
 * Returns production rates for all resource types
 * Includes server-side caching (5 min) for performance
 */
router.get('/production-rates', (_req, res) => {
	try {
		const now = Date.now();

		// Check cache first
		if (productionRatesCache && now - productionRatesCache.timestamp < CACHE_DURATION_MS) {
			logger.debug('[API] Returning cached production rates');
			return res.json({
				success: true,
				data: productionRatesCache.data,
				cached: true,
				cacheAge: Math.floor((now - productionRatesCache.timestamp) / 1000),
				timestamp: now,
			});
		}

		// Cache miss - build from config
		logger.debug('[API] Cache miss - building production rates from config');

		const rates = DEFAULT_GAME_CONFIG.productionRates;
		const baseRates: Record<string, number> = {};

		// Filter for primary resource extractors (not special/advanced)
		const primaryExtractors = new Set(['FARM', 'WELL', 'LUMBER_MILL', 'QUARRY', 'MINE']);
		const primaryRates = rates.filter((r) => primaryExtractors.has(r.extractorType));

		for (const rate of primaryRates) {
			const resourceKey = rate.resourceType.toLowerCase();
			baseRates[resourceKey] = rate.baseRate;
		}

		const responseData = {
			baseRates,
			fullConfig: rates,
		};

		// Update cache
		productionRatesCache = {
			data: responseData,
			timestamp: now,
		};

		logger.debug(`[API] Cached ${Object.keys(baseRates).length} base production rates`);

		return res.json({
			success: true,
			data: responseData,
			cached: false,
			timestamp: now,
		});
	} catch (error) {
		logger.error('[API] Error fetching production rates:', error);
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch production rates',
		});
	}
});

/**
 * GET /api/config/game
 * Returns the game configuration (production rates, biome efficiencies, etc.)
 * This is public data that doesn't require authentication
 */
router.get('/game', async (_req, res) => {
	try {
		// Future enhancement: Fetch from database tables for dynamic configuration
		// For now, return the default configuration from code
		res.json(DEFAULT_GAME_CONFIG);
	} catch (error) {
		logger.error('Error fetching game config:', error);
		res.status(500).json({ error: 'Failed to fetch game configuration' });
	}
});

/**
 * GET /api/config/version
 * Returns the current configuration version for cache invalidation
 */
router.get('/version', async (_req, res) => {
	try {
		// Future enhancement: Store version in database, increment when balance changes
		// For now, use a static version
		res.json({ version: '1.0.0', lastUpdated: new Date().toISOString() });
	} catch (error) {
		logger.error('Error fetching config version:', error);
		res.status(500).json({ error: 'Failed to fetch configuration version' });
	}
});

export default router;
