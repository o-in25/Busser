import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';

// Shared rules for all file types
// Note: Formatting rules (brace-style, spacing, etc.) are handled by Prettier
const sharedRules = {
	'prefer-destructuring': [
		'error',
		{ VariableDeclarator: { object: true, array: false } },
		{ enforceForRenamedProperties: false },
	],
	'prettier/prettier': 'error',
};

export default [
	eslint.configs.recommended,
	prettierConfig,
	{
		ignores: ['node_modules/**', '.svelte-kit/**', 'build/**', '**/*.json', '**/*.js'],
	},
	// TypeScript files
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsparser,
			parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
			globals: { ...globals.browser, ...globals.node },
		},
		plugins: {
			'@typescript-eslint': tseslint,
			prettier: prettier,
		},
		rules: {
			...sharedRules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},
	// Svelte files
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: { parser: tsparser, ecmaVersion: 'latest', sourceType: 'module' },
			globals: { ...globals.browser },
		},
		plugins: {
			svelte: sveltePlugin,
			'@typescript-eslint': tseslint,
			prettier: prettier,
		},
		rules: {
			...sveltePlugin.configs.recommended.rules,
			...sharedRules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},
];
