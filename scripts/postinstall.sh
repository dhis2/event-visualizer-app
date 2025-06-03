#!/bin/bash
set -e

if [ ! -f .hooks/_/husky.sh ]; then
    yarn d2-style install
fi

if [ ! -f types/dhis2-openapi-schemas/index.ts ]; then
    yarn generate-types
fi

if [ ! -f cypress.env.json ]; then
    cp cypress.env.template.json cypress.env.json
fi
