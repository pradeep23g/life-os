import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const FEATURE_DEEP_IMPORT_PATTERNS = [
  '**/features/*/**',
  '../../admin/**',
  '../../arc/**',
  '../../auth/**',
  '../../data-lab/**',
  '../../finance-os/**',
  '../../fitness-os/**',
  '../../home/**',
  '../../learning-os/**',
  '../../mind-os/**',
  '../../mission-control/**',
  '../../productivity-hub/**',
  '../../profile/**',
  '../../reports/**',
  '../../system/**',
  '../../time-os/**',
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Invariant 1: Cognitive Boundary — Mind OS (Reflection) and Productivity Hub (Execution) never import each other
  {
    files: ['src/features/mind-os/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/productivity-hub', '**/productivity-hub/**'],
              message: 'Cognitive Boundary (Invariant 1): Mind OS cannot import from Productivity Hub.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/productivity-hub/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/mind-os', '**/mind-os/**'],
              message: 'Cognitive Boundary (Invariant 1): Productivity Hub cannot import from Mind OS.',
            },
          ],
        },
      ],
    },
  },
  // FSD Downward Layering: shared/core layers cannot import from features or layout
  {
    files: [
      'src/lib/**/*.{ts,tsx}',
      'src/store/**/*.{ts,tsx}',
      'src/types/**/*.{ts,tsx}',
      'src/hooks/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/layout/**'],
              message: 'FSD Layering: Lower layers (lib, store, types, hooks, components) cannot import from features or layout.',
            },
          ],
        },
      ],
    },
  },
  // Public API Barrel Contract: cross-feature and layout->feature imports must use domain index.ts barrels
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/layout/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: FEATURE_DEEP_IMPORT_PATTERNS,
              message: 'Public API Barrel Contract: Import from the domain barrel (e.g. "../../time-os") instead of deep internal paths.',
            },
          ],
        },
      ],
    },
  },
])
