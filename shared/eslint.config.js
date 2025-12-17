import baseConfig from '../eslint.config.base.js';

export default [
	...baseConfig,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
			},
		},
	},
];
