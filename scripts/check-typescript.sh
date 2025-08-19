#!/bin/bash
# TypeScript check script - checks all project TypeScript configurations
# Returns exit code 0 if all checks pass, 1 if any fail

# List of TypeScript config files to check
TSCONFIG_FILES=("tsconfig.json" "cypress/tsconfig.json")

echo "🔍 Checking TypeScript..."
TS_FAILED=false
TS_ERRORS=""

set +e  # Don't exit on error
for config in "${TSCONFIG_FILES[@]}"; do
    if [ -n "$TYPESCRIPT_ERRORS_OUTPUT" ]; then
        # Pre-commit mode: capture output for filtering
        TS_OUTPUT=$(npx tsc --project "$config" --noEmit --skipLibCheck 2>&1)
        if [ $? -ne 0 ]; then
            TS_FAILED=true
            # Filter out "Checking..." messages and add to accumulated errors
            FILTERED_OUTPUT=$(echo "$TS_OUTPUT" | grep -v "^Checking ")
            TS_ERRORS="$TS_ERRORS$FILTERED_OUTPUT"$'\n'
        fi
    else
        # Direct mode: let tsc write directly to terminal (preserves colors/links)
        if ! npx tsc --project "$config" --noEmit --skipLibCheck; then
            TS_FAILED=true
        fi
    fi
done
set -e  # Re-enable exit on error

if [ "$TS_FAILED" = true ]; then
    echo "❌ TypeScript check failed"
    # If TYPESCRIPT_ERRORS_OUTPUT variable is set, store errors there for caller to use
    if [ -n "$TYPESCRIPT_ERRORS_OUTPUT" ]; then
        printf '%s' "$TS_ERRORS" > "$TYPESCRIPT_ERRORS_OUTPUT"
    fi
    # Note: In direct mode, errors were already printed by tsc
    exit 1
else
    echo "✅ TypeScript check passed"
    exit 0
fi
