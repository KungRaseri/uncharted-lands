import type { PageServerLoad, Action, Actions } from "./$types"
import { fail, redirect } from "@sveltejs/kit"
import { AccountRole, ServerStatus } from "@prisma/client"
import { db } from "$lib/db"

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    return {
        servers: db.server.findMany({
            include: {
                worlds: {
                    include: {
                        regions: {
                            include: {
                                tiles: {
                                    include: {
                                        resources: true
                                    },
                                }
                            }
                        }
                    }
                },
                playerProfiles: true
            }
        })
    }
}

const create: Action = async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');

    if (typeof name !== 'string' ||
        !name) {
        return fail(400, { invalid: true })
    }

    const server = await db.server.findUnique({ where: { name } });
    if (server) {
        return fail(400, { exists: true })
    }

    await db.server.create({
        data: {
            name,
            status: ServerStatus.OFFLINE
        }
    });

    throw redirect(302, '/admin/servers')
}

export const actions: Actions = { create }
