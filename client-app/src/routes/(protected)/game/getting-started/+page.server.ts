import { db } from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import bcrypt from 'bcrypt';
import { page } from '$app/stores';
import { AccountRole } from "@prisma/client";

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account.playerProfiles) {
        throw redirect(302, '/game')
    }
}

const createProfile: Action = async ({ cookies, request }) => {
    const data = await request.formData();

    // const account = await db.account.findUnique({
    //     where: { email }
    // })

    // if (account) {
    //     return fail(400, { exists: true })
    // }

    // if (password.length < 16) {
    //     return fail(400, { length: true })
    // }

    // const user = await db.account.create({
    //     data: {
    //         email,
    //         passwordHash: await bcrypt.hash(password, 10),
    //         role: AccountRole.MEMBER,
    //         userAuthToken: crypto.randomUUID()
    //     }
    // });

    // cookies.set('session', user.userAuthToken, {
    //     path: '/',
    //     httpOnly: true,
    //     sameSite: 'strict',
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 60 * 60 * 6 // 30 days if remember me is checked, otherwise it's 6 hours
    // })

    throw redirect(302, '/')
}

export const actions: Actions = { createProfile }