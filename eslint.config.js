import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import globals from 'globals';

// Layer boundaries (see TZ "Architecture"): domain is pure; transport knows only the wire format;
// core wraps the host; features orchestrate; ui renders.
const zones = [
    {
        target: './src/shared',
        from: ['./src/domain', './src/transport', './src/core', './src/features', './src/integration', './src/ui'],
        message: 'shared holds wire types only and imports nothing from other layers.',
    },
    {
        target: './src/domain',
        from: ['./src/transport', './src/core', './src/features', './src/integration', './src/ui'],
        message: 'domain must stay pure: no DOM, network or SillyTavern.',
    },
    {
        target: './src/transport',
        from: ['./src/domain', './src/features', './src/integration', './src/ui'],
        message: 'transport receives a ready payload and knows no business logic.',
    },
    {
        target: './src/core',
        from: ['./src/domain', './src/transport', './src/features', './src/integration', './src/ui'],
        message: 'core is the host wrapper and must not depend on upper layers.',
    },
    {
        target: './src/features',
        from: ['./src/integration', './src/ui'],
        message: 'features must not depend on UI or integration glue.',
    },
];

// User-visible strings must go through t(): flag literals passed straight into the DOM or toasts.
const hardcodedUiStrings = [
    {
        selector:
            "AssignmentExpression[left.property.name=/^(textContent|innerText|title|placeholder)$/][right.type='Literal'][right.value=/[A-Za-z\\u0400-\\u04FF]/]",
        message: 'User-visible text must come from t().',
    },
    {
        selector: "CallExpression[callee.object.name='toastr'] > Literal[value=/[A-Za-z\\u0400-\\u04FF]/]",
        message: 'Toast text must come from t().',
    },
];

export default tseslint.config(
    { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'docs/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts'],
        plugins: { 'import-x': importX },
        languageOptions: { globals: { ...globals.browser } },
        settings: {
            'import-x/resolver-next': [createTypeScriptImportResolver({ project: './tsconfig.json' })],
        },
        rules: {
            'import-x/no-restricted-paths': ['error', { zones }],
            'no-restricted-syntax': ['error', ...hardcodedUiStrings],
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['src/domain/**/*.ts', 'src/shared/**/*.ts'],
        rules: {
            'no-restricted-globals': [
                'error',
                { name: 'fetch', message: 'domain has no network access.' },
                { name: 'document', message: 'domain has no DOM access.' },
                { name: 'window', message: 'domain has no DOM access.' },
                { name: 'localStorage', message: 'domain has no storage access.' },
                { name: 'SillyTavern', message: 'domain must not know SillyTavern.' },
                { name: 'toastr', message: 'domain has no UI.' },
                { name: 'console', message: 'domain reports warnings instead of logging.' },
            ],
        },
    },
    {
        files: ['server/**/*.js', 'scripts/**/*.mjs', '*.config.ts', 'eslint.config.js'],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        files: ['tests/**/*.ts'],
        languageOptions: { globals: { ...globals.node } },
        rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
    },
);
