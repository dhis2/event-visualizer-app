// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('@dhis2/cli-style')

module.exports = {
    extends: [
        config.eslintReact,
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
    ],
    rules: {
        'import/extensions': 'off',
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
                            "Please import types from '@types' instead of directly from generated files.",
                    },
                ],
            },
        ],
    },
    overrides: [
        {
            files: ['src/types/index.ts'],
            rules: {
                'no-restricted-imports': 'off',
            },
        },
    ],
}
