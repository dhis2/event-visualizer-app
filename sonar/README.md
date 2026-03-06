# Local SonarQube with SonarCloud Sync

Docker Compose setup for local SonarQube with dynamic SonarCloud sync.

## Quick Start

From project root:

```bash
yarn sonar:setup     # Setup SonarQube and sync from SonarCloud
yarn sonar:scan      # Run full repository scan
yarn sonar:scan:new  # Run new files scan only
yarn sonar:stop      # Stop SonarQube
yarn sonar:clean     # Stop and remove all data
```

From sonar directory:

```bash
./setup.sh           # Setup SonarQube and sync from SonarCloud
./scan.sh            # Run full repository scan (default)
./scan.sh new        # Run new files scan only
```

View results at: <http://localhost:9000/dashboard?id=dhis2_event-visualizer-app>

## How It Works

### Simplified Architecture

1. **Local Script Execution**: All scripts run locally (not in containers)
2. **Minimal Docker**: Only SonarQube runs in Docker, scripts run on host
3. **Direct Communication**: Scanner container connects to SonarQube via `host.docker.internal`

### Setup Process (`setup.sh`)

1. **Start SonarQube**: Starts Docker container with fixed admin credentials (admin/admin)
2. **Parse Configuration**: Reads `sonar-project.properties` for organization and project key
3. **Query SonarCloud**: Fetches language distribution (`ncloc_language_distribution`)
4. **Sync Profiles**: Downloads quality profiles for languages actually used
5. **Create Local Profiles**: Creates "SonarCloud Sync" profiles (avoids built-in profile conflicts)
6. **Sync Quality Gate**: Creates "DHIS2 Sync" gate matching SonarCloud's "DHIS2 way"

### Scanning Process (`scan.sh`)

1. **Check SonarQube**: Verifies SonarQube is running
2. **Run Scanner**: Executes `sonar-scanner` in Docker container
3. **Connect to Host**: Uses `host.docker.internal:9000` to reach SonarQube
4. **Token Authentication**: Uses auto-generated admin token (required for analysis)
5. **Clear Organization**: Removes SonarCloud organization setting for local scans
6. **Scan Modes**: Supports `full` (default) and `new` (new files only) modes
7. **Auto Token Generation**: `setup.sh` generates fresh token and updates `scan.sh`

## Key Features

-   **Simplified Setup**: Local scripts, minimal Docker footprint
-   **Dynamic Language Detection**: Only syncs profiles for languages actually used
-   **No `.env` File**: All configuration parsed from existing `sonar-project.properties`
-   **Token Authentication**: Scanner uses auto-generated admin tokens (required for analysis)
-   **Fixed Admin Credentials**: Prevents password change requirement in UI
-   **Custom Profile Naming**: "SonarCloud Sync" avoids conflicts with built-in profiles
-   **Quality Gate Sync**: "DHIS2 Sync" matches SonarCloud's "DHIS2 way" gate
-   **Dual Scan Modes**: Full repository scan and new files scan
-   **Cross-Platform**: Works on macOS, Linux, and Windows (Docker Desktop)

## Files

-   `docker-compose.yml` - Docker configuration with fixed admin credentials
-   `setup.sh` - Main setup script (includes all helper functions)
-   `scan.sh` - Scan wrapper with mode selection (full/new), runs scanner in Docker

## Notes

-   **Local Access**: SonarQube UI at <http://localhost:9000> (admin/admin)
-   **Auto Token Management**: `setup.sh` generates fresh tokens and updates `scan.sh`
-   **Separate Results**: Local scans don't affect SonarCloud project
-   **Dynamic Updates**: Setup adapts to project changes in SonarCloud
-   **Platform Support**: Uses `host.docker.internal` (works on macOS/Windows Docker Desktop)
-   **Cleanup**: Use `yarn sonar:clean` to remove all data volumes (requires `sonar:setup` afterwards)

## Troubleshooting

### Scanner Can't Connect to SonarQube

If scanner fails with connection or authentication errors:

-   Ensure SonarQube is running: `curl http://localhost:9000/api/system/status`
-   On Linux, replace `host.docker.internal` with `172.17.0.1` in `scan.sh`
-   Verify authentication: Try `curl -u admin:admin http://localhost:9000/api/system/status`
-   **Token lifecycle**: Tokens are stored in SonarQube database (Docker volume)
    -   `sonar:clean` removes volumes → tokens are lost
    -   `sonar:setup` generates new tokens and updates `scan.sh`
    -   If token is invalid, run `yarn sonar:setup` to regenerate

### Setup Script Hangs

If `setup.sh` hangs waiting for SonarQube:

-   Check Docker logs: `docker-compose logs sonarqube`
-   SonarQube may need more time to start (first-time setup takes 1-2 minutes)

### Permission Issues

If scripts fail with permission errors:

-   Make scripts executable: `chmod +x setup.sh scan.sh`
-   Run from project root using `yarn` commands instead

### Platform Warnings

If you see "platform mismatch" warnings:

-   Ignore them - scanner works despite architecture warnings
-   Or add `--platform linux/amd64` to docker run commands in `scan.sh`
