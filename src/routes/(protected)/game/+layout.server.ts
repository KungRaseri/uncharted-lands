// TODO: Migrate to REST API - create /api/servers endpoint
import { db } from "$lib/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
    return {
        server: await db.server.findFirst(),
    }
}