// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('@dhis2/cli-style')

const baseAppRuntimeHooksRestriction = {
    importNames: ['useDataQuery', 'useDataMutation', 'useDataEngine'],
    message: "Use 'useRtkQuery' and 'useRtkMutation' from 'src/hooks' instead.",
}

module.exports = {
    extends: [
        config.eslintReact,
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
    ],
    reportUnusedDisableDirectives: false,
    rules: {
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
    ],
}
