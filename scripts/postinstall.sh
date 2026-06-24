#!/bin/bash
set -e

if [ ! -f .hooks/_/husky.sh ]; then
    pnpm d2-style install
fi

# d2-style install only re-points core.hooksPath when the husky shim is missing, but a
# sandbox clone can reset hooksPath while leaving the shim in place — so ensure it here.
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
