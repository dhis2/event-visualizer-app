#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="${1:-https://e2e.im.dhis2.org/idv-playground}"
ENV_FILE="$DIR/../cypress.env.json"
CREDENTIALS="$(jq -r '"\(.dhis2Username):\(.dhis2Password)"' "$ENV_FILE")"

INSTANCE="$(curl -sS --fail -u "$CREDENTIALS" "$BASE_URL/api/eventVisualizations?fields=id,name&paging=false")"

PROBLEMS="$(jq -n \
    --argjson instance "$INSTANCE" \
    --slurpfile dump "$DIR/db-dump-visualizations.json" \
    --slurpfile files <(cat "$DIR"/visualizations/*.json) '
    def names: map({(.id): .name}) | add // {};
    def with($o): with_entries(select(.key as $id | $o | has($id)));
    def without($o): with_entries(select(.key as $id | $o | has($id) | not));

    $dump[0] as $dump
    | ([$files[].eventVisualizations[]] | names) as $files
    | ($instance.eventVisualizations | names) as $instance
    | {
        "In visualizations/, but part of the DB dump": ($files | with($dump)),
        "On the instance, but neither in the DB dump nor in visualizations/": ($instance | without($dump) | without($files)),
        "Part of the DB dump, but deleted from the instance": ($dump | without($instance))
    }
    | with_entries(select(.value != {}))')"

echo "Checking $BASE_URL"
if [ "$PROBLEMS" != "{}" ]; then
    echo "$PROBLEMS"
    exit 1
fi
echo "Clean: the DB dump, plus only visualizations from visualizations/"
