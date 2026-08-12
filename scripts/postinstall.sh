#!/bin/bash
set -e

if [ "$(git config --get core.hooksPath)" != ".hooks" ]; then
    git config core.hooksPath .hooks
fi

if [ ! -f src/types/dhis2-openapi-schemas/index.ts ]; then
    pnpm generate-types
fi

if [ ! -f cypress.env.json ]; then
    echo "📋 Copying cypress.env.template.json to cypress.env.json..."
    cp cypress.env.template.json cypress.env.json
fi
