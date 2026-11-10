#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="${1:-https://e2e.im.dhis2.org/idv-playground}"
ENV_FILE="$DIR/../cypress.env.json"
CREDENTIALS="$(jq -r '"\(.dhis2Username):\(.dhis2Password)"' "$ENV_FILE")"

# Each file is a metadata payload, so merge them into one by concatenating the arrays per type
PAYLOAD="$(jq -s 'reduce (.[] | to_entries[]) as $type ({}; .[$type.key] += $type.value)' "$DIR"/visualizations/*.json)"

echo "Importing into $BASE_URL"
REPORT="$(curl -sS -u "$CREDENTIALS" -H 'Content-Type: application/json' \
    -X POST "$BASE_URL/api/metadata?atomicMode=ALL&importReportMode=ERRORS" \
    --data-binary "$PAYLOAD")"

jq '(.response // .) | {
    status,
    stats,
    errors: [.typeReports[]?.objectReports[]?.errorReports[]? | "\(.mainId) [\(.errorCode)] \(.message)"]
}' <<<"$REPORT"
jq -e '(.response // .).status != "ERROR"' <<<"$REPORT" >/dev/null
