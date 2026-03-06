#!/bin/bash

# Script to run SonarScanner against local SonarQube instance
# Usage: ./scan.sh [full|new]
#   full: Full repository scan (default)
#   new:  Scan only new/changed files

set -e

SCAN_MODE="${1:-full}"

echo "=== Running SonarQube Scan ($SCAN_MODE mode) ==="
echo ""

# Check if SonarQube is running
if ! curl -s http://localhost:9000/api/system/status > /dev/null; then
    echo "ERROR: SonarQube is not running at http://localhost:9000"
    echo ""
    echo "If you just ran 'yarn sonar:clean', you need to set up SonarQube again:"
    echo "  yarn sonar:setup     # Full setup (recommended - creates project and token)"
    echo "  yarn sonar:start     # Just start SonarQube (if already configured)"
    echo ""
    echo "Note: 'sonar:clean' removes everything including tokens."
    echo "      'sonar:setup' generates new tokens and configures everything."
    exit 1
fi

# Check if project exists (optional, but helpful for debugging)
# Note: This check requires authentication, so we'll skip it if token parsing fails
TOKEN_LINE=$(grep "SONAR_TOKEN=" scan.sh | head -1)
TOKEN=$(echo "$TOKEN_LINE" | grep -o "SONAR_TOKEN=[^ ]*" | cut -d= -f2)
if [ -n "$TOKEN" ]; then
    if ! curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:9000/api/projects/search?projects=dhis2_event-visualizer-app" | grep -q '"total":1'; then
        echo "WARNING: Project 'dhis2_event-visualizer-app' not found in SonarQube or token lacks permission"
        echo "You may need to run setup first: yarn sonar:setup"
        echo "Continuing anyway..."
    fi
fi

echo "Running scanner in $SCAN_MODE mode..."

# Set scanner options based on mode
SCANNER_OPTS=""
if [ "$SCAN_MODE" = "new" ]; then
    # For new files scan, use new code reference branch
    echo "Running new files scan (comparing to main branch)..."
    SCANNER_OPTS="-Dsonar.newCode.referenceBranch=main"
else
    echo "Running full repository scan..."
fi

# Run sonar-scanner using docker
echo "Running sonar-scanner with options: $SCANNER_OPTS"
docker run --rm \
    -e SONAR_HOST_URL=http://host.docker.internal:9000 \
    -e SONAR_TOKEN=squ_c28d8b1929c4a76ef9c4086daafa83c61a58b05f \
    -e SONAR_ORGANIZATION='' \
    -v "$(pwd)/..:/usr/src" \
    -w /usr/src \
    sonarsource/sonar-scanner-cli:latest \
    sonar-scanner \
    -Dsonar.host.url=http://host.docker.internal:9000 \
    -Dsonar.organization= \
    -Dsonar.projectKey=dhis2_event-visualizer-app \
    $SCANNER_OPTS

echo ""
echo "Scan complete! View results at: http://localhost:9000/dashboard?id=dhis2_event-visualizer-app"
echo ""
echo "Note: The scan results are stored in the local SonarQube instance."
echo "      They are separate from your SonarCloud project."
