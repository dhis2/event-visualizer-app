#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# SonarQube URL - can be overridden by environment variable
SONARQUBE_URL="${SONARQUBE_URL:-http://localhost:9000}"

# Log functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Parse sonar-project.properties file
parse_sonar_properties() {
    local properties_file="${1:-../sonar-project.properties}"

    if [ ! -f "$properties_file" ]; then
        log_error "Sonar properties file not found: $properties_file"
        return 1
    fi

    # Read properties
    local organization
    local project_key
    local project_name

    organization=$(grep -E '^sonar\.organization=' "$properties_file" | cut -d'=' -f2- | tr -d '\r')
    project_key=$(grep -E '^sonar\.projectKey=' "$properties_file" | cut -d'=' -f2- | tr -d '\r')

    if [ -z "$organization" ]; then
        log_error "Organization not found in $properties_file"
        return 1
    fi

    if [ -z "$project_key" ]; then
        log_error "Project key not found in $properties_file"
        return 1
    fi

    # Extract project name from project key (remove organization prefix)
    if [[ "$project_key" == "${organization}_"* ]]; then
        project_name="${project_key#${organization}_}"
    else
        project_name="$project_key"
        log_warn "Project key doesn't start with organization prefix: $project_key"
    fi

    echo "$organization"
    echo "$project_key"
    echo "$project_name"
}

# Wait for SonarQube to be ready
wait_for_sonarqube() {
    log_info "Waiting for SonarQube API to be ready..."
    local max_attempts=30
    local attempt=1

    until curl -s -u admin:admin "${SONARQUBE_URL}/api/system/status" | grep -q '"status":"UP"'; do
        if [ $attempt -ge $max_attempts ]; then
            log_error "SonarQube failed to start after $max_attempts attempts"
            return 1
        fi

        log_info "SonarQube not ready yet (attempt $attempt/$max_attempts)..."
        sleep 5
        attempt=$((attempt + 1))
    done

    log_info "SonarQube is ready!"
    return 0
}

# Get project language distribution from SonarCloud
get_project_languages() {
    local project_key="$1"
    log_info "Getting language distribution from SonarCloud project..."

    local lang_dist
    lang_dist=$(curl -s "https://sonarcloud.io/api/measures/component?component=${project_key}&metricKeys=ncloc_language_distribution" | jq -r '.component.measures[0].value // empty')

    if [ -z "$lang_dist" ] || [ "$lang_dist" = "null" ]; then
        log_error "Could not get language distribution from SonarCloud"
        return 1
    fi

    echo "$lang_dist"
    return 0
}

# Get quality profiles from SonarCloud organization
get_sonarcloud_profiles() {
    local organization="$1"
    log_info "Getting quality profiles from SonarCloud organization..."

    local profiles_json
    profiles_json=$(curl -s "https://sonarcloud.io/api/qualityprofiles/search?organization=${organization}")

    if echo "$profiles_json" | grep -q '"errors"'; then
        log_error "Failed to get quality profiles from SonarCloud"
        return 1
    fi

    echo "$profiles_json"
    return 0
}

# Get quality gate conditions from SonarCloud project
get_sonarcloud_quality_gate() {
    local project_key="$1"
    log_info "Getting quality gate conditions from SonarCloud project..."

    local gate_status
    gate_status=$(curl -s "https://sonarcloud.io/api/qualitygates/project_status?projectKey=${project_key}")

    if echo "$gate_status" | grep -q '"errors"'; then
        log_warn "Project might not have a quality gate configured in SonarCloud"
        return 1
    fi

    echo "$gate_status"
    return 0
}

# Create or update local quality profile
create_local_profile() {
    local language="$1"
    local profile_name="$2"
    local organization="$3"

    log_info "Processing $language with profile '$profile_name'..."

    # Export from SonarCloud
    local encoded_name
    encoded_name=$(echo "$profile_name" | sed 's/ /%20/g')
    local export_url="https://sonarcloud.io/api/qualityprofiles/export?organization=${organization}&language=${language}&qualityProfile=${encoded_name}"

    log_info "Exporting profile from SonarCloud..."
    if ! curl -s "$export_url" -o "/tmp/sonarcloud-${language}.xml"; then
        log_error "Failed to download profile for $language"
        return 1
    fi

    if [ ! -s "/tmp/sonarcloud-${language}.xml" ]; then
        log_error "Empty profile file for $language"
        return 1
    fi

    # Modify profile name to avoid conflicts
    local local_profile_name="SonarCloud Sync"
    sed -i.bak "s|<name>${profile_name}</name>|<name>${local_profile_name}</name>|g" "/tmp/sonarcloud-${language}.xml"

    # Delete existing profile if it exists
    local existing_profile
    existing_profile=$(curl -s -u admin:admin "${SONARQUBE_URL}/api/qualityprofiles/search?language=${language}" | grep -o "\"name\":\"${local_profile_name}\"" || true)

    if [ -n "$existing_profile" ]; then
        log_info "Deleting existing profile..."
        curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualityprofiles/delete?qualityProfile=${local_profile_name}&language=${language}"
    fi

    # Import the profile
    log_info "Importing profile..."
    local response
    response=$(curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualityprofiles/restore" \
        -H "Content-Type: multipart/form-data" \
        -F "backup=@/tmp/sonarcloud-${language}.xml")

    if echo "$response" | grep -q '"errors"'; then
        log_error "Error importing profile: $response"
        rm -f "/tmp/sonarcloud-${language}.xml" "/tmp/sonarcloud-${language}.xml.bak"
        return 1
    fi

    log_info "Profile imported successfully"

    # Set as default
    curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualityprofiles/set_default?qualityProfile=${local_profile_name}&language=${language}"

    # Clean up
    rm -f "/tmp/sonarcloud-${language}.xml" "/tmp/sonarcloud-${language}.xml.bak"

    return 0
}

# Create project if it doesn't exist
create_project() {
    local project_key="$1"
    local project_name="$2"

    log_info "Checking if project '${project_key}' exists locally..."

    # Check if project exists
    local project_exists
    project_exists=$(curl -s -u admin:admin "${SONARQUBE_URL}/api/projects/search?projects=${project_key}" | grep -o "\"key\":\"${project_key}\"" || true)

    if [ -n "$project_exists" ]; then
        log_info "Project '${project_key}' already exists locally."
        return 0
    fi

    # Create project
    log_info "Creating project '${project_key}' (${project_name})..."
    local response
    response=$(curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/projects/create" \
        -d "name=${project_name}&project=${project_key}&visibility=public")

    if echo "$response" | grep -q '"errors"'; then
        log_error "Failed to create project: $response"
        return 1
    fi

    log_info "Project created successfully"
    return 0
}

# Set project quality profile
set_project_profile() {
    local project_key="$1"
    local language="$2"

    local local_profile_name="SonarCloud Sync"
    log_info "Setting project to use '${local_profile_name}' for ${language}..."

    # URL encode parameters
    local encoded_project_key
    encoded_project_key=$(echo "$project_key" | sed 's/_/%5F/g')
    local encoded_profile_name
    encoded_profile_name=$(echo "$local_profile_name" | sed 's/ /%20/g')

    local response
    response=$(curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualityprofiles/add_project?language=${language}&project=${encoded_project_key}&qualityProfile=${encoded_profile_name}")

    if echo "$response" | grep -q '"errors"'; then
        log_error "Failed to set profile for project: $response"
        return 1
    fi

    log_info "Profile set successfully"
    return 0
}

# Create or update local quality gate
create_local_quality_gate() {
    local project_key="$1"
    local gate_status_json="$2"

    local gate_name="DHIS2 Sync"

    # Check if gate already exists
    local existing_gate
    existing_gate=$(curl -s -u admin:admin "${SONARQUBE_URL}/api/qualitygates/list" | grep -o "\"name\":\"${gate_name}\"" || true)

    if [ -n "$existing_gate" ]; then
        log_info "Quality gate '${gate_name}' already exists locally."

        # Get the gate ID
        local gate_id
        gate_id=$(curl -s -u admin:admin "${SONARQUBE_URL}/api/qualitygates/show?name=${gate_name// /%20}" | grep -o '"id":[0-9]*' | cut -d: -f2)

        if [ -n "$gate_id" ]; then
            log_info "Deleting existing conditions..."
            # Get existing conditions and delete them
            local existing_conditions
            existing_conditions=$(curl -s -u admin:admin "${SONARQUBE_URL}/api/qualitygates/show?name=${gate_name// /%20}" | grep -o '"id":[0-9]*' | cut -d: -f2 | tail -n +2)
            for cond_id in $existing_conditions; do
                curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualitygates/delete_condition?id=${cond_id}"
            done
        fi
    else
        log_info "Creating '${gate_name}' quality gate locally..."

        # Create the quality gate
        local create_response
        create_response=$(curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualitygates/create?name=${gate_name// /%20}")

        if echo "$create_response" | grep -q '"errors"'; then
            log_error "Error creating quality gate: $create_response"
            return 1
        fi

        log_info "Quality gate created successfully."

        # Get the gate ID
        gate_id=$(curl -s -u admin:admin "${SONARQUBE_URL}/api/qualitygates/show?name=${gate_name// /%20}" | grep -o '"id":[0-9]*' | cut -d: -f2)
    fi

    if [ -n "$gate_id" ]; then
        log_info "Quality gate ID: ${gate_id}"

        # Add conditions from SonarCloud
        local conditions
        conditions=$(echo "$gate_status_json" | jq -r '.projectStatus.conditions[] | "\(.metricKey)=\(.errorThreshold)=\(.comparator)"' 2>/dev/null || true)

        if [ -n "$conditions" ]; then
            log_info "Adding conditions from SonarCloud..."
            echo "$conditions" | while IFS='=' read -r metric error op; do
                if [ -n "$metric" ] && [ -n "$error" ] && [ -n "$op" ]; then
                    log_info "  Adding condition: ${metric} ${op} ${error}"
                    curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualitygates/create_condition" \
                        -d "gateId=${gate_id}&metric=${metric}&op=${op}&error=${error}"
                fi
            done
        fi

        # Set as project's quality gate
        log_info "Setting project to use '${gate_name}' quality gate..."
        curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/qualitygates/select?projectKey=${project_key}&gateName=${gate_name// /%20}"
    fi

    return 0
}

# Main script starts here
echo "=== Setting up local SonarQube to match SonarCloud ==="
echo "This script will:"
echo "1. Start SonarQube Docker containers"
echo "2. Wait for SonarQube to be ready"
echo "3. Dynamically sync quality profiles based on project language usage"
echo "4. Sync quality gate rules from SonarCloud project"
echo ""

# Parse sonar-project.properties
log_info "Parsing sonar-project.properties..."
if ! PROPERTIES=$(parse_sonar_properties); then
    log_error "Failed to parse sonar-project.properties"
    exit 1
fi

# Read the parsed properties
ORGANIZATION=$(echo "$PROPERTIES" | sed -n '1p')
PROJECT_KEY=$(echo "$PROPERTIES" | sed -n '2p')
PROJECT_NAME=$(echo "$PROPERTIES" | sed -n '3p')

log_info "Organization: $ORGANIZATION"
log_info "Project key: $PROJECT_KEY"
log_info "Project name: $PROJECT_NAME"

# Start Docker containers (only if not running in a container)
if [ -z "${DOCKER_CONTAINER}" ] && [ ! -f /.dockerenv ]; then
    log_info "Starting SonarQube Docker containers..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR"
    docker-compose up -d
fi

# Wait for SonarQube to be ready
if ! wait_for_sonarqube; then
    log_error "Failed to start SonarQube"
    exit 1
fi

# Create project first
log_info "=== Creating project ==="
if ! create_project "$PROJECT_KEY" "$PROJECT_NAME"; then
    log_error "Failed to create project"
    exit 1
fi

# Get project language distribution
log_info "=== Syncing quality profiles ==="
LANG_DIST=$(get_project_languages "$PROJECT_KEY")
if [ $? -ne 0 ]; then
    log_error "Failed to get language distribution"
    exit 1
fi

echo "Language distribution: $LANG_DIST"

# Get quality profiles from SonarCloud
PROFILES_JSON=$(get_sonarcloud_profiles "$ORGANIZATION")
if [ $? -ne 0 ]; then
    log_error "Failed to get quality profiles"
    exit 1
fi

# Process each language found in the project
LANGUAGES=""
while IFS='=' read -r LANG COUNT; do
    if [ -n "$LANG" ] && [ "$LANG" != "null" ]; then
        LANGUAGES="$LANGUAGES $LANG"
        log_info "Found language: $LANG ($COUNT lines)"
    fi
done < <(echo "$LANG_DIST" | tr ';' '\n')

# Sync profiles for each language
for LANG in $LANGUAGES; do
    echo ""
    # Extract profile name for this language from SonarCloud
    PROFILE_NAME=$(echo "$PROFILES_JSON" | jq -r ".profiles[] | select(.language == \"$LANG\") | .name" | head -1)

    if [ -z "$PROFILE_NAME" ] || [ "$PROFILE_NAME" = "null" ]; then
        log_warn "No quality profile found for $LANG in SonarCloud, skipping..."
        continue
    fi

    # Create local profile
    if create_local_profile "$LANG" "$PROFILE_NAME" "$ORGANIZATION"; then
        # Set project to use this profile
        set_project_profile "$PROJECT_KEY" "$LANG"
    fi
done

# Sync quality gate
log_info ""
log_info "=== Syncing quality gate rules ==="
GATE_STATUS_JSON=$(get_sonarcloud_quality_gate "$PROJECT_KEY")
if [ $? -eq 0 ]; then
    create_local_quality_gate "$PROJECT_KEY" "$GATE_STATUS_JSON"
else
    log_warn "No quality gate to sync (project might not have one configured)"
fi

# Generate scanner token
log_info "=== Generating scanner token ==="

# First, try to revoke existing token if it exists
curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/user_tokens/revoke" \
    -d "name=scanner-token" > /dev/null 2>&1 || true

# Generate new token
TOKEN_RESPONSE=$(curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/user_tokens/generate" \
    -d "name=scanner-token")
    
if echo "$TOKEN_RESPONSE" | grep -q '"token"'; then
    SONAR_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    log_info "Scanner token generated: ${SONAR_TOKEN:0:10}..."
    
    # Update scan.sh with the new token (only update the docker command line)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # Only match lines that start with "    -e SONAR_TOKEN=" (docker command)
    sed -i.bak "s/^    -e SONAR_TOKEN=.*/    -e SONAR_TOKEN=${SONAR_TOKEN} \\\/" "${SCRIPT_DIR}/scan.sh"
    rm -f "${SCRIPT_DIR}/scan.sh.bak"
    log_info "Updated scan.sh with new token"
else
    log_warn "Failed to generate scanner token: $TOKEN_RESPONSE"
    log_warn "Trying to use existing token or generate with different name..."
    
    # Try with a timestamp-based name
    TOKEN_NAME="scanner-token-$(date +%s)"
    TOKEN_RESPONSE=$(curl -s -u admin:admin -X POST "${SONARQUBE_URL}/api/user_tokens/generate" \
        -d "name=${TOKEN_NAME}")
    
    if echo "$TOKEN_RESPONSE" | grep -q '"token"'; then
        SONAR_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        log_info "Scanner token generated with name '${TOKEN_NAME}': ${SONAR_TOKEN:0:10}..."
        
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        sed -i.bak "s/^    -e SONAR_TOKEN=.*/    -e SONAR_TOKEN=${SONAR_TOKEN} \\\/" "${SCRIPT_DIR}/scan.sh"
        rm -f "${SCRIPT_DIR}/scan.sh.bak"
        log_info "Updated scan.sh with new token"
    else
        log_warn "Completely failed to generate scanner token"
        log_warn "You may need to generate a token manually and update scan.sh"
    fi
fi

echo ""
log_info "=== Setup complete! ==="
echo ""
echo "Local SonarQube is now configured to match SonarCloud."
echo ""
echo "Key features:"
echo "• Only syncs profiles for languages actually used in the project"
echo "• Uses 'SonarCloud Sync' as local profile name (avoids built-in conflicts)"
echo "• Syncs exact quality gate rules from SonarCloud project"
echo "• Project configured with the same rules as SonarCloud"
echo ""
echo "Access SonarQube at: ${SONARQUBE_URL}"
echo ""
echo "To run a scan: yarn sonar:scan"
echo "To stop SonarQube: docker-compose down"
echo ""
echo "Scanner token has been configured for authentication."
