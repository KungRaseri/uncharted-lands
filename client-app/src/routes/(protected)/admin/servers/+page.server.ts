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
                        regions: true
                    }
                },
                profileServerData: {
                    include: {
                        settlements: true
                    }
                }
            }
        })
    }
}

const create: Action = async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    const hostname = data.get('hostname');
    const port = data.get('port');

    if (typeof name !== 'string' ||
        !name ||
        typeof hostname !== 'string' ||
        !hostname ||
        typeof port !== 'string' ||
        !port) {
        return fail(400, { invalid: true })
    }

    const portInt = Number.parseInt(port);

    const server = await db.server.findUnique({ where: { name } });
    if (server) {
        return fail(400, { invalid: true, exists: true })
    }

    await db.server.create({
        data: {
            name,
            hostname,
            port: portInt,
            status: ServerStatus.OFFLINE
        }
    });

    throw redirect(302, '/admin/servers')
}

export const actions: Actions = { create }
