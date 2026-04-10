import { includeIgnoreFile } from '@eslint/compat'
import dhis2ReactConfig from '@dhis2/config-eslint/react'
import { defineConfig, globalIgnores } from 'eslint/config'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

const baseAppRuntimeHooksRestriction = {
    importNames: ['useDataQuery', 'useDataMutation', 'useDataEngine'],
    message: "Use 'useRtkQuery' and 'useRtkMutation' from 'src/hooks' instead.",
}

export default defineConfig([
    includeIgnoreFile(gitignorePath),

    { extends: [dhis2ReactConfig] },

    globalIgnores(['.vite/**/*', 'scripts/**/*']),

    // TypeScript-specific custom rules (scoped to files the base config processes)
    {
        files: ['src/**/*.{ts,mts,cts,tsx}'],
        rules: {
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },

    // Project-wide custom rules
    {
        rules: {
            // Disable import/named — it produces false positives with path aliases
            // and packages like @dhis2/ui since the TS resolver is not configured.
            // TypeScript itself catches these errors.
            'import/named': 'off',
            // Disable React Compiler rules from react-hooks v7 — too
            // aggressive for the current codebase.
            'react-hooks/immutability': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/use-memo': 'off',
            'react-hooks/globals': 'off',
            'import/no-default-export': 'error',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: [
                                '**/types/dhis2-openapi-schemas',
                                '**/types/dhis2-openapi-schemas/*',
                            ],
                            message:
                                "Import DHIS2 Core schema-types from '@types' instead of directly from generated files.",
                        },
                        {
                            group: ['../*'],
                            message:
                                "Relative parent imports are not allowed. Use path aliases (e.g. '@hooks', '@components') instead.",
                        },
                    ],
                    paths: [
                        {
                            name: '@dhis2/app-runtime',
                            ...baseAppRuntimeHooksRestriction,
                        },
                        {
                            name: '@dhis2/app-service-data',
                            ...baseAppRuntimeHooksRestriction,
                        },
                        {
                            name: 'react-redux',
                            importNames: [
                                'useDispatch',
                                'useSelector',
                                'useStore',
                            ],
                            message:
                                "Use 'useAppDispatch', 'useAppSelector', and 'useAppStore' from 'src/hooks' instead for proper typing.",
                        },
                    ],
                },
            ],
        },
    },

    // Override: config files and src/locales/index.js need default exports
    {
        files: ['src/locales/index.js', '*.config.*', '.prettierrc.*'],
        rules: {
            'import/order': 'off',
            'import/no-default-export': 'off',
        },
    },

    // Override: test directories -- allow one level of parent imports
    {
        files: ['**/__tests__/**/*.{js,jsx,ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['../../*'],
                            message:
                                'In __tests__ directories, you may only import from one parent level (../filename). Deeper parent imports are not allowed.',
                        },
                    ],
                },
            ],
        },
    },

    // Override: generated schema types
    {
        files: ['src/types/dhis2-openapi-schemas/**/*'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
        },
    },

    // Override: types/index.ts
    {
        files: ['src/types/index.ts'],
        rules: {
            'no-restricted-imports': 'off',
        },
    },

    // Override: vitest spec files
    {
        files: ['src/**/*.spec.{ts,tsx}'],
        rules: {
            'no-restricted-globals': [
                'error',
                {
                    name: 'describe',
                    message:
                        "Import describe from 'vitest' instead of using the global.",
                },
                {
                    name: 'it',
                    message:
                        "Import it from 'vitest' instead of using the global.",
                },
                {
                    name: 'test',
                    message:
                        "Import test from 'vitest' instead of using the global.",
                },
                {
                    name: 'expect',
                    message:
                        "Import expect from 'vitest' instead of using the global.",
                },
                {
                    name: 'beforeEach',
                    message:
                        "Import beforeEach from 'vitest' instead of using the global.",
                },
                {
                    name: 'afterEach',
                    message:
                        "Import afterEach from 'vitest' instead of using the global.",
                },
                {
                    name: 'beforeAll',
                    message:
                        "Import beforeAll from 'vitest' instead of using the global.",
                },
                {
                    name: 'afterAll',
                    message:
                        "Import afterAll from 'vitest' instead of using the global.",
                },
            ],
        },
    },

    // Override: Cypress component test files
    {
        files: ['src/**/*.cy.tsx'],
        rules: {
            'react/prop-types': 'off',
        },
    },

    // Override: all Cypress files
    {
        files: ['**/*.cy.ts', '**/*.cy.tsx'],
        rules: {
            'no-restricted-imports': 'off',
        },
    },
])
