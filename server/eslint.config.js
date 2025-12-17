import typescriptParser from '@typescript-eslint/parser';
import baseConfig from '../eslint.config.base.js';

export default [
	...baseConfig,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			parser: typescriptParser,
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		// Rules are inherited from baseConfig, but we can override here if needed
		rules: {
			// Project uses strict typing
			'@typescript-eslint/no-explicit-any': 'error',
		},
	},
];
