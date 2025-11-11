import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, depends, cookies }) => {
    // Mark this data as dependent on game state changes
    depends('game:settlement');
    depends('game:data');

    const sessionToken = cookies.get('session');

    const response = await fetch(`${API_URL}/settlements/${params.id}`, {
        headers: {
            'Cookie': `session=${sessionToken}`
        }
    });
    
    if (!response.ok) {
        logger.error('[SETTLEMENT DETAIL] Failed to fetch settlement', {
            settlementId: params.id,
            status: response.status
        });
        return {
            settlement: null,
            lastUpdate: new Date().toISOString(),
            error: 'Settlement not found'
        };
    }

    const settlement = await response.json();

    logger.debug('[SETTLEMENT DETAIL] Settlement loaded', {
        settlementId: settlement.id,
        name: settlement.name
    });

    return {
        settlement,
        lastUpdate: new Date().toISOString()
    }
}) satisfies PageServerLoad;

export const actions: Actions = {
    buildStructure: async ({ request, params, cookies }) => {
        const formData = await request.formData();
        const structureId = formData.get('structureId');

        if (!structureId || typeof structureId !== 'string') {
            logger.error('[BUILD STRUCTURE] Invalid structure ID', { structureId });
            return fail(400, { 
                success: false, 
                message: 'Invalid structure ID' 
            });
        }

        const sessionToken = cookies.get('session');

        try {
            // Call the REST API endpoint for building structures
            const response = await fetch(`${API_URL}/structures/create`, {
                method: 'POST',
                headers: {
                    'Cookie': `session=${sessionToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    settlementId: params.id,
                    buildingType: structureId,
                    name: undefined,
                    description: undefined
                })
            });

            if (!response.ok) {
                const result = await response.json();
                logger.error('[BUILD STRUCTURE] Failed to build structure', {
                    settlementId: params.id,
                    structureId,
                    status: response.status,
                    error: result
                });
                
                return fail(response.status, {
                    success: false,
                    message: result.message || 'Failed to build structure',
                    reasons: [result.code || 'UNKNOWN_ERROR']
                });
            }

            const result = await response.json();

            logger.info('[BUILD STRUCTURE] Structure built successfully', {
                settlementId: params.id,
                structureId,
                structureName: result.name
            });

            return {
                success: true,
                message: `${result.name || 'Structure'} built successfully!`
            };

        } catch (error) {
            logger.error('[BUILD STRUCTURE] Error building structure', {
                settlementId: params.id,
                structureId,
                error
            });
            
            return fail(500, {
                success: false,
                message: 'An error occurred while building the structure'
            });
        }
    }
};