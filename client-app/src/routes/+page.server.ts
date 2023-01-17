import type { PageServerLoad } from "./$types";
import { PrismaClient, type Account } from "@prisma/client";
const db = new PrismaClient();

export const load: PageServerLoad = async function ({ request, setHeaders }) {
    return {}
}