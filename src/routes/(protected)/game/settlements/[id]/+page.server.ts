import { db } from '$lib/db';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getStructureDefinition, canBuildStructure } from '$lib/game/structures';

export const load = (async ({ params }) => {
    const settlement = await db.settlement.findUnique({
        where: {
            id: params.id
        },
        include: {
            Plot: {
                include: {
                    Settlement: true,
                    Tile: true
                }
            },
            Storage: true,
            Structures: {
                include: {
                    modifiers: true,
                    buildRequirements: true
                }
            }
        }
    })

    if (!settlement)
        throw fail(404, { invalid: true, params: params.id })

    return {
        settlement
    }
}) satisfies PageServerLoad;

export const actions: Actions = {
    buildStructure: async ({ params, request }) => {
        const data = await request.formData();
        const structureId = data.get('structureId')?.toString();

        if (!structureId) {
            return fail(400, { success: false, message: 'Structure ID is required' });
        }

        // Get structure definition
        const structureDef = getStructureDefinition(structureId);
        if (!structureDef) {
            return fail(400, { success: false, message: 'Invalid structure type' });
        }

        // Get settlement with current resources
        const settlement = await db.settlement.findUnique({
            where: { id: params.id },
            include: {
                Storage: true,
                Plot: true
            }
        });

        if (!settlement) {
            return fail(404, { success: false, message: 'Settlement not found' });
        }

        // Check if player can afford this structure
        const affordability = canBuildStructure(
            structureDef,
            settlement.Storage,
            settlement.Plot
        );

        if (!affordability.canBuild) {
            return fail(400, {
                success: false,
                message: 'Cannot build structure',
                reasons: affordability.reasons
            });
        }

        try {
            // Create structure with requirements and modifiers in a transaction
            await db.$transaction(async (tx) => {
                // Create structure requirements
                const requirements = await tx.structureRequirements.create({
                    data: {
                        area: structureDef.requirements.area,
                        solar: structureDef.requirements.solar,
                        wind: structureDef.requirements.wind,
                        food: structureDef.requirements.food,
                        water: structureDef.requirements.water,
                        wood: structureDef.requirements.wood,
                        stone: structureDef.requirements.stone,
                        ore: structureDef.requirements.ore
                    }
                });

                // Create the structure
                const structure = await tx.settlementStructure.create({
                    data: {
                        settlementId: settlement.id,
                        structureRequirementsId: requirements.id,
                        name: structureDef.name,
                        description: structureDef.description
                    }
                });

                // Create modifiers
                if (structureDef.modifiers.length > 0) {
                    await tx.structureModifier.createMany({
                        data: structureDef.modifiers.map(mod => ({
                            settlementStructureId: structure.id,
                            name: mod.name,
                            description: mod.description,
                            value: mod.value
                        }))
                    });
                }

                // Deduct resources from storage
                await tx.settlementStorage.update({
                    where: { id: settlement.settlementStorageId },
                    data: {
                        food: { decrement: structureDef.requirements.food },
                        water: { decrement: structureDef.requirements.water },
                        wood: { decrement: structureDef.requirements.wood },
                        stone: { decrement: structureDef.requirements.stone },
                        ore: { decrement: structureDef.requirements.ore }
                    }
                });
            });

            return {
                success: true,
                message: `${structureDef.name} built successfully!`
            };
        } catch (error) {
            console.error('Failed to build structure:', error);
            return fail(500, {
                success: false,
                message: 'Failed to build structure'
            });
        }
    }
};