import { db } from '$lib/db';
import { invalid, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';


export const load: PageServerLoad = async () => {

}

const register: Action = async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const username = data.get('username');
    const password = data.get('password');

    if (typeof email !== 'string' ||
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !email ||
        !username ||
        !password) {
        return invalid(400, { invalid: true })
    }

    let accountByEmail = await db.account.findUnique({
        where: { email }
    })

    let accountByUsername = await db.account.findUnique({
        where: { username }
    })

    if (accountByEmail || accountByUsername) {
        return invalid(400, { exists: "Email or Username already exists." })
    }

    await db.account.create({
        data: {
            email,
            username,
            passwordHash: await bcrypt.hash(password, 10),
            role: Role.MEMBER,
            userAuthToken: crypto.randomUUID()
        }
    })

    throw redirect(303, '/login')
}

export const actions: Actions = { register }