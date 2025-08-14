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
            // ESLint seems to think these are not TS files
            files: ['src/**/*.cy.tsx'],
            rules: {
                'react/prop-types': 'off',
            },
        },
    ],
}
