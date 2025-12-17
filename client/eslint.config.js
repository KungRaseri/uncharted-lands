import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import baseConfig from '../eslint.config.base.js';

export default [
	// Use base config (includes js.configs.recommended, commonIgnores, baseTypeScriptConfig)
	...baseConfig,
	// Override TypeScript config to add browser globals and Svelte support
	{
		files: ['**/*.js', '**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2022,
				extraFileExtensions: ['.svelte']
			},
			globals: {
				...globals.browser,
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
			// Inherit from base
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-console': 'off'
		}
	},
	...sveltePlugin.configs['flat/recommended'],
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				sourceType: 'module',
				ecmaVersion: 2022
			},
			globals: {
				...globals.browser,
				...globals.es2021,
				// Svelte 5 runes
				$state: 'readonly',
				$derived: 'readonly',
				$effect: 'readonly',
				$props: 'readonly',
				$inspect: 'readonly'
			}
		}
	},
	{
		files: ['**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2022
			},
			globals: {
				...globals.browser,
				...globals.es2021,
				// Svelte 5 runes for .svelte.ts files (stores)
				$state: 'readonly',
				$derived: 'readonly',
				$effect: 'readonly',
				$props: 'readonly',
				$inspect: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...tsPlugin.configs.recommended.rules
		}
	},
	prettierConfig
];
