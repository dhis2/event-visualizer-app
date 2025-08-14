#!/bin/bash
# Lint script - runs all linting tools and collects errors
# Exit with non-zero code if any tool fails

echo "Running all linting tools..."
echo "============================"

EXIT_CODE=0

# TypeScript check
echo "🔍 Checking TypeScript..."
TS_FAILED=false
for config in tsconfig*.json; do
    if ! npx tsc --project "$config" --noEmit --skipLibCheck; then
        TS_FAILED=true
    fi
done

if [ "$TS_FAILED" = true ]; then
    echo "❌ TypeScript check failed"
    EXIT_CODE=1
else
    echo "✅ TypeScript check passed"
fi
echo ""

# ESLint check
echo "🔍 Checking ESLint..."
if ! npx eslint .; then
    echo "❌ ESLint check failed"
    EXIT_CODE=1
else
    echo "✅ ESLint check passed"
fi
echo ""

# Stylelint check
echo "🔍 Checking Stylelint..."
if ! npx stylelint "**/*.{css,scss,tsx}"; then
    echo "❌ Stylelint check failed"
    EXIT_CODE=1
else
    echo "✅ Stylelint check passed"
fi
echo ""

# ls-lint check
echo "🔍 Checking ls-lint..."
if ! npx ls-lint; then
    echo "❌ ls-lint check failed"
    EXIT_CODE=1
else
    echo "✅ ls-lint check passed"
fi
echo ""

# Prettier check
echo "🔍 Checking Prettier..."
if ! npx prettier --check .; then
    echo "❌ Prettier check failed"
    EXIT_CODE=1
else
    echo "✅ Prettier check passed"
fi
echo ""

echo "============================"
if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 All linting checks passed!"
else
    echo "💥 Some linting checks failed. Please fix the issues above."
fi

exit $EXIT_CODE
