#!/bin/bash
set -e


# Configuration
API_URL="https://play.im.dhis2.org/dev/api/openapi.yaml"
TYPES_DIR="./src/types/dhis2-openapi-schemas"
TEMP_DIR="./temp-openapi"
AUTH_HEADER="Authorization: Basic $(echo -n "admin:district" | base64)"

# Clean and create directories
rm -rf "$TEMP_DIR" "$TYPES_DIR"
mkdir -p "$TEMP_DIR" "$TYPES_DIR"

# Fetch OpenAPI spec
echo "📥 Fetching OpenAPI specification..."
curl -H "Accept: application/x-yaml" -H "$AUTH_HEADER" "$API_URL" -o "$TEMP_DIR/openapi.yaml"

# Generate types with openapi-typescript
echo "⌛ Generating TypeScript types..."
npx openapi-typescript "$TEMP_DIR/openapi.yaml" --output "$TYPES_DIR/generated.d.ts"

# Generate named type aliases
echo "🔗 Generating named type aliases..."
awk '
BEGIN {
    print "// AUTO-GENERATED FILE: Named type aliases for OpenAPI schemas"
    print "// Regenerate this file if the OpenAPI spec changes.\n"
    print "import type { components } from '\''./generated'\'';\n"
    print "type Schemas = components['\''schemas'\''];\n"
}
$0 ~ /export interface components/ { in_components=1 }
in_components && $0 ~ /schemas:/ { in_schemas=1 }
in_schemas && /^[ ]{8}[A-Za-z0-9_]+(\??):/ {
    key = $1
    gsub(":", "", key)
    gsub(/\?/, "", key)
    if (key != "" && key != "parameters" && key != "requestBody" && key != "responses")
        print "export type " key " = Schemas[\047" key "\047];"
}
in_schemas && /^[ ]{6}\}/ { in_schemas=0 }
in_components && /^}/ { in_components=0 }
' "$TYPES_DIR/generated.d.ts" > "$TYPES_DIR/index.d.ts"

# # Generate named type aliases using Node.js script
# echo "🔗 Generating named type aliases..."
# node ./scripts/generate-type-aliases.cjs "$TYPES_DIR/generated.d.ts" "$TYPES_DIR/index.d.ts"

# Format the output
echo "💅 Formatting output..."
npx prettier --write "$TYPES_DIR" >/dev/null

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Types generated in $TYPES_DIR"
