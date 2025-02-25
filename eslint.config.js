import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const error = 2;
const warn = 1;
const off = 0;

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
        ...globals.es6,
        ...globals.jquery,
        globalThis: true,
      },
    },
    plugins: {
      prettier,
      'import': importPlugin,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...prettier.configs.recommended.rules,
      // braces
      'curly': error,
      'no-empty': [error, { allowEmptyCatch: true }],

      // variables, objects & arguments
      'dot-notation': error,
      'no-multi-assign': error,
      'no-param-reassign': error,
      'no-undef': error,
      'no-use-before-define': off,
      'no-var': error,
      'object-shorthand': error,
      'one-var': [error, 'never'],
      'prefer-const': error,
      'prefer-destructuring': error,
      'prefer-spread': error,

      // restricted syntax
      'no-array-constructor': error,
      'no-console': [error, { allow: ['error', 'warn'] }],
      'no-eval': error,
      'no-iterator': error,
      'no-loop-func': error,
      'no-new-func': error,
      'no-new-object': error,
      'no-new-wrappers': error,
      'no-sequences': error,

      // strings
      'no-useless-concat': error,
      'prefer-template': error,

      // other errors
      'camelcase': [error, { allow: ['_(arg|pr|st)$'] }],
      'eqeqeq': error,
      'no-unneeded-ternary': error,

      // spacing & empty lines
      'lines-between-class-members': [warn, 'always', { exceptAfterSingleLine: true }],
      'spaced-comment': warn,

      // function usage
      'array-callback-return': warn,
      'class-methods-use-this': warn,
      'func-style': [warn, 'declaration', { allowArrowFunctions: true }],
      'no-useless-call': warn,
      'prefer-rest-params': warn,

      // other warnings
      'no-else-return': warn,
      'no-unused-vars': [warn, { argsIgnorePattern: '^_' }],

      // disabled rules
      'import/exports-last': off,
      'import/no-duplicates': off,
      'no-confusing-arrow': off,
    },
  },
];
