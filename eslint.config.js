import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    files: ['**/*.ts'],
    ignores: ['node_modules/**', 'dist/**'],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error'
    },
  },
] 