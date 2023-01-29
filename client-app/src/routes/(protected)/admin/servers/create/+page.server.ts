import { db } from "$lib/db"
import { AccountRole, Prisma, ServerStatus } from "@prisma/client"
import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    return {}
}

const createServer: Action = async ({ request }) => {
    const data = await request.formData();
    const name = data.get("name")
    const hostname = data.get("hostname")
    const port = data.get("port")

    if (typeof name !== 'string' ||
        !name ||
        typeof hostname !== 'string' ||
        !hostname ||
        typeof port !== 'string' ||
        !port) {
        return fail(400, { invalid: true })
    }

    try {
        await db.server.create({
            data: {
                name,
                hostname,
                port: Number.parseInt(port)
            }
        })

        throw redirect(302, '/admin/servers')
    }
    catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
                return fail(400, { invalid: true, message: e.message })
            }
        }

        console.log(typeof e)
        return fail(400, { invalid: true, message: "Unknown error occured" })
    }
}

export const actions: Actions = { createServer }
