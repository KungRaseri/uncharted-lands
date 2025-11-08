// TODO: Implement password reset functionality (needs server endpoint and email system)
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account) {
        throw redirect(302, '/')
    }
}

const resetPassword: Action = async ({ request }) => {
    // STUB: Password reset not yet implemented
    // This needs:
    // 1. Server endpoint POST /api/auth/forgot-password
    // 2. Email system to send reset tokens
    // 3. Token validation
    return fail(501, { 
        message: 'Password reset functionality not yet implemented. Please contact an administrator.' 
    })
}

export const actions: Actions = { resetPassword }