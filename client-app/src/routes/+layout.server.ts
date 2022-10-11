import type { ServerLoad } from "@sveltejs/kit";
import { PrismaClient, type Account } from "@prisma/client";
const db = new PrismaClient();

export const load: ServerLoad = async function ({ request, setHeaders, locals }) {
	return {}
}