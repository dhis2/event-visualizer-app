// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('@dhis2/cli-style')

const baseAppRuntimeHooksRestriction = {
    importNames: ['useDataQuery', 'useDataMutation', 'useDataEngine'],
    message: "Use 'useRtkQuery' and 'useRtkMutation' from 'src/hooks' instead.",
}

module.exports = {
    settings: {
        'import/resolver': {
            typescript: {
                project: [
                    './tsconfig.json',
                    './tsconfig.cypress-e2e.json',
                    './tsconfig.cypress-component.json',
                ],
                noWarnOnMultipleProjects: true,
            },
        },
    },
    extends: [
        config.eslintReact,
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
    ],
    reportUnusedDisableDirectives: false,
    rules: {
        'react/react-in-jsx-scope': 'off',
        'import/extensions': 'off',
        'import/no-default-export': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
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
                    // Restrict all relative parent imports (../ and ../../ etc)
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
                        importNames: ['useDispatch', 'useSelector', 'useStore'],
                        message:
                            "Use 'useAppDispatch', 'useAppSelector', and 'useAppStore' from 'src/hooks' instead for proper typing.",
                    },
                ],
            },
        ],
    },
    overrides: [
        {
            files: ['src/locales/index.js'],
            rules: {
                'import/order': 'off',
                'import/no-default-export': 'off',
            },
        },
        // Allow one level up relative import in __tests__ dirs, but not higher
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
        {
            files: ['src/types/dhis2-openapi-schemas/**/*'],
            rules: {
                // Disable TypeScript rules that are violated in generated code
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-namespace': 'off',
            },
        },
        {
            files: ['src/types/index.ts'],
            rules: {
                'no-restricted-imports': 'off',
            },
        },
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
        {
            // ESLint seems to think these are not TS files
            files: ['src/**/*.cy.tsx'],
            rules: {
                'react/prop-types': 'off',
            },
        },
        {
            files: ['**/*.cy.ts', '**/*.cy.tsx'],
            rules: {
                'no-restricted-imports': 'off',
            },
        },
    ],
}
