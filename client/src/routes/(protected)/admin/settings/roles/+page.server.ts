import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Current role configuration from the database schema
	const roles = [
		{
			id: 'MEMBER',
			name: 'Member',
			description: 'Default player role with basic game access',
			permissions: ['game.play', 'settlement.create', 'settlement.manage_own'],
			userCount: 0, // This would be fetched from the database
			isSystem: true
		},
		{
			id: 'SUPPORT',
			name: 'Support',
			description: 'Support staff with moderation capabilities',
			permissions: [
				'game.play',
				'settlement.create',
				'settlement.manage_own',
				'player.view',
				'player.moderate',
				'support.tickets'
			],
			userCount: 0,
			isSystem: true
		},
		{
			id: 'ADMINISTRATOR',
			name: 'Administrator',
			description: 'Full system access and configuration',
			permissions: [
				'*' // All permissions
			],
			userCount: 0,
			isSystem: true
		}
	];

	// Available permissions catalog
	const availablePermissions = [
		{
			category: 'Game',
			permissions: [
				{ id: 'game.play', name: 'Play Game', description: 'Access to play the game' },
				{ id: 'game.admin', name: 'Game Admin', description: 'Admin game functions' }
			]
		},
		{
			category: 'Settlement',
			permissions: [
				{
					id: 'settlement.create',
					name: 'Create Settlement',
					description: 'Create new settlements'
				},
				{
					id: 'settlement.manage_own',
					name: 'Manage Own',
					description: 'Manage own settlements'
				},
				{
					id: 'settlement.manage_all',
					name: 'Manage All',
					description: 'Manage any settlement'
				},
				{ id: 'settlement.delete', name: 'Delete', description: 'Delete settlements' }
			]
		},
		{
			category: 'Player',
			permissions: [
				{ id: 'player.view', name: 'View Players', description: 'View player information' },
				{ id: 'player.moderate', name: 'Moderate', description: 'Moderate player actions' },
				{ id: 'player.ban', name: 'Ban Players', description: 'Ban/unban players' },
				{ id: 'player.delete', name: 'Delete', description: 'Delete player accounts' }
			]
		},
		{
			category: 'Support',
			permissions: [
				{
					id: 'support.tickets',
					name: 'Support Tickets',
					description: 'Manage support tickets'
				},
				{ id: 'support.chat', name: 'Support Chat', description: 'Access support chat' }
			]
		},
		{
			category: 'System',
			permissions: [
				{
					id: 'system.settings',
					name: 'System Settings',
					description: 'Modify system settings'
				},
				{ id: 'system.logs', name: 'View Logs', description: 'Access system logs' },
				{ id: 'system.backup', name: 'Backup', description: 'Create/restore backups' }
			]
		}
	];

	return {
		roles,
		availablePermissions
	};
};

export const actions: Actions = {
	updateRole: async ({ request }) => {
		const formData = await request.formData();
		const _roleId = formData.get('roleId') as string;
		const _permissions = formData.getAll('permissions') as string[];

		// This would update the role configuration in the database
		// For now, since roles are defined in the schema, this is a placeholder

		return fail(400, {
			error: 'Role modification requires database schema changes. This feature will be implemented when role permissions are moved to the database.'
		});
	},

	createRole: async ({ request }) => {
		const formData = await request.formData();
		const _name = formData.get('name') as string;
		const _description = formData.get('description') as string;
		const _permissions = formData.getAll('permissions') as string[];

		// This would create a new role in the database

		return fail(400, {
			error: 'Custom role creation requires database schema changes. This feature will be implemented in a future update.'
		});
	}
};
