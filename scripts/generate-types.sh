#!/bin/bash
set -e

# Configuration
API_URL="https://play.im.dhis2.org/dev/api/openapi.yaml"
OUTPUT_DIR="./src/types/dhis2-openapi-schemas"
TEMP_DIR="./temp-openapi"
AUTH_HEADER="Authorization: Basic $(echo -n "admin:district" | base64)"

# Clean and create directories
rm -rf "$TEMP_DIR" "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR" "$OUTPUT_DIR"

# Fetch OpenAPI spec
echo "📥 Fetching OpenAPI specification..."
curl -H "Accept: application/x-yaml" -H "$AUTH_HEADER" "$API_URL" -o "$TEMP_DIR/openapi.yaml"

# Generate types with openapi-typescript-codegen
echo "⌛ Generating TypeScript types..."
npx openapi-typescript-codegen generate \
    --input "$TEMP_DIR/openapi.yaml" \
    --output "$OUTPUT_DIR" \
    --exportModels true \
    --exportCore false \
    --exportServices false

# Move models to root of generated directory
echo "🔄 Organizing type files..."
find "$OUTPUT_DIR/models" -name '*.ts' -exec mv {} "$OUTPUT_DIR" \;
rm -rf "$OUTPUT_DIR/models"

# Create index file that exports all models
echo "📄 Creating index file..."
echo "// AUTO-GENERATED TYPES - DO NOT MODIFY" >"$OUTPUT_DIR/index.ts"
echo "// Generated from $API_URL" >>"$OUTPUT_DIR/index.ts"
echo "" >>"$OUTPUT_DIR/index.ts"

for file in "$OUTPUT_DIR"/*.ts; do
    if [ "$(basename "$file")" != "index.ts" ]; then
        name=$(basename "$file" .ts)
        echo "export * from './$name';" >>"$OUTPUT_DIR/index.ts"
    fi
done

# Format the output
echo "💅 Formatting output..."
# Prettier echoes each file it formats, even with --log-level silent
# so just send it to the bit bucket
npx prettier --write "$OUTPUT_DIR" >/dev/null

# Remove eslint-disable comments from generated files
echo "🧹 Removing eslint-disable comments..."
find "$OUTPUT_DIR" -name '*.ts' -type f -exec sed -i '' '/^\/\* eslint-disable \*\/$/d' {} \;

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Types generated in $OUTPUT_DIR"
