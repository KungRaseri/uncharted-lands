/**
 * Base ESLint configuration for the Uncharted Lands monorepo
 * 
 * This config provides common rules shared across all packages.
 * Individual packages extend this and add their own specific rules.
 */

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

/**
 * Common ignore patterns for all packages
 */
export const commonIgnores = {
	ignores: [
		'**/node_modules/**',
		'**/dist/**',
		'**/build/**',
		'**/.svelte-kit/**',
		'**/.vercel/**',
		'**/coverage/**',
		'**/*.cjs'
	]
};

/**
 * Base TypeScript configuration for .ts and .js files
 */
export const baseTypeScriptConfig = {
	files: ['**/*.js', '**/*.ts'],
	languageOptions: {
		parser: tsParser,
		parserOptions: {
			sourceType: 'module',
			ecmaVersion: 2022
		},
		globals: {
			...globals.es2021,
			...globals.node
		}
	},
	plugins: {
		'@typescript-eslint': tsPlugin
	},
	rules: {
		...tsPlugin.configs.recommended.rules,
		// Disable base ESLint no-unused-vars in favor of TypeScript version
		'no-unused-vars': 'off',
		// Allow unused vars that start with underscore
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		// Console is allowed (we use it for logging)
		'no-console': 'off'
	}
};

/**
 * Default export for packages that want the full base config
 */
export default [
	{
		...js.configs.recommended,
		rules: {
			...js.configs.recommended.rules,
			// Disable base no-unused-vars - each package will use TypeScript version
			'no-unused-vars': 'off'
		}
	},
	commonIgnores,
	baseTypeScriptConfig
];
