import type { ServerLoad } from "@sveltejs/kit";
import { PrismaClient, type Account } from "@prisma/client";
const db = new PrismaClient();

export const load: ServerLoad = async function ({ request, setHeaders }) {
	let account: Account = {
		id: crypto.randomUUID().toString(),
		email: "test@email.com",
		username: "test username",
		passwordHash: "tasdhfa938ha39t8yalijhasdf",
		userAuthToken: ""
	};

	return {
		account
	}
}