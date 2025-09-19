import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierConfig from 'eslint-config-prettier';
import tsdoc from 'eslint-plugin-tsdoc';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.nodeBuiltin,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      jsdoc: jsdoc,
      tsdoc: tsdoc,
      import: importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-requiring-type-checking'].rules,

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',

      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': 'error',

      // JSDoc
      'jsdoc/check-tag-names': ['warn', {definedTags: ['privateRemarks']}],
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-throws-type': 'off',
      'jsdoc/tag-lines': ['error', 'any', {startLines: 1, count: 0}],

      // TSDoc Syntax
      'tsdoc/syntax': 'error',

      // Import order
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // NPM packages
            'internal', // Aliased modules (e.g., '@/components')
            'parent',
            ['sibling', 'index'], // Relatives imports
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            orderImportKind: 'asc',
          },
          named: {
            enabled: true,
            types: 'types-first',
          },
        },
      ],

      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    },
    settings: {
      // Add JSDoc settings here for this config object
      jsdoc: {
        mode: 'typescript', // Essential for eslint-plugin-jsdoc to understand TS JSDoc
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  prettierConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '*.js'],
  },
];
