import type { ServerLoad } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const mainMenuLinks = [
	{
		name: 'Home',
		route: '/',
		isActive: false
	},
	{
		name: 'Forum',
		route: '/forum',
		isActive: false
	},
	// {
	// 	name: 'Game',
	// 	route: '/game',
	// 	isActive: false
	// },
	{
		name: 'Admin',
		route: '/admin',
		isActive: false,
		requiredRole: "ADMINISTRATOR"
	}
];

const userMenuLinks = [
	{
		name: 'Account',
		route: '/account',
		isActive: false
	},
	{
		name: 'Admin',
		route: '/admin',
		isActive: false,
		requiredRole: "ADMINISTRATOR"
	}
];

export const load: ServerLoad = async function ({ locals, route }) {
	mainMenuLinks.forEach(async (link) => {
		if (route.id === '/' && link.route === '/') {
			link.isActive = true
			return;
		}

		if (link.route !== '/' && route.id?.includes(link.route)) {
			link.isActive = true
			return;
		}

		link.isActive = false
	});

	userMenuLinks.forEach(async (link) => {
		if (link.route !== '/' && route.id?.includes(link.route)) {
			link.isActive = true;
			return;
		}

		link.isActive = false;
	});

	return {
		account: locals.account,
		mainMenuLinks: mainMenuLinks,
		userMenuLinks: userMenuLinks
	}
}