//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      // Index access into ref arrays can be empty at runtime; the guards are intentional.
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-shadow': 'off',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js', '.output/**', '.shots/**', 'scripts/**', 'src/routeTree.gen.ts'],
  },
]
