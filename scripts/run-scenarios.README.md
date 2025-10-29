# run-scenarios Script Usage

## Overview

`run-scenarios.cjs` automates execution of ordered Bruno API test scenarios for Ed-Fi certification testing. It creates an isolated mirror of the `bruno/Tests` and `bruno/SIS` collections, applies placeholder substitutions from each entity's `test-config.json`, rewrites `meta.seq` in the ordered request files, executes Bruno once per folder, and produces structured JSON results plus an aggregate summary.

Use this to validate incremental entities as you add properly structured `test-config.json` configurations.

## Prerequisites

- Node.js 16+ (LTS recommended)
- Bruno CLI available via PATH (optional). If not present, script falls back to `npx -p @usebruno/cli bru`.
- A working Ed-Fi API environment defined in Bruno environment files. Default env name is `ci.ed-fi.org` (single env file stored under `bruno/Tests/environments/`). Override with `--env <name>`.

## File Locations

- Script: `scripts/run-scenarios.cjs`
- Source Collections: `bruno/Tests` and `bruno/SIS`
- Mirrored Workspace: `automation-testing/`
  - Per-entity result JSON: `automation-testing/results/<EntityName>.json`
  - Aggregate summary: `automation-testing/results/summary.json`
  - Latest raw Bruno output: `automation-testing/results/last-output.txt`

## test-config.json Schema

Each entity folder under `bruno/Tests/v4/<Group>/<Entity>/` must include a `test-config.json` file:

```jsonc
{
  "name": "BellSchedules", // Required: display name; if missing => config error failure
  "data": { // Optional: key/value pairs used for placeholder replacement
    "SCHOOL_ID": 255901001,
    "BELL_SCHEDULE_NAME": "2025 Fall Schedule"
  },
  "order": [ // Required: ordered list of .bru request file paths
    "bruno/Tests/v4/MasterSchedule/BellSchedules/01 - CREATE a BellSchedule.bru",
    "bruno/SIS/v4/MasterSchedule/BellSchedules/01 - Check BellSchedule is valid.bru",
    "bruno/Tests/v4/MasterSchedule/BellSchedules/02 - DELETE a BellSchedule.bru"
  ]
}
```

### Behavior on Missing Fields

- Missing `name`: Adds a `CONFIG_ERROR: missing name` failure step; entity considered failed.
- Missing or empty `order`: Adds a `CONFIG_ERROR: missing order` failure step; entity considered failed.
- Both missing: Two failure steps recorded.

## Placeholder Replacement

All occurrences of each `data` key or bracketed form `[KEY]` inside entity-level `.bru` and `.json` files are replaced by its stringified value. Example:

- Before: `"educationOrganizationId": [SCHOOL_ID]`
- After:  `"educationOrganizationId": 255901001`

## Execution Model

1. Delete & recreate `automation-testing/`.
2. Copy entire `bruno/Tests` & `bruno/SIS` trees into automation root.
3. For each entity config that passes filtering:

    - Apply placeholder replacements.
    - Rewrite `meta.seq` values per declared order list.
    - Group ordered files by folder (`v4/<Group>/<Entity>`) and run Bruno once per folder.
    - Parse Bruno output (HTTP status & assertion counts per request).

4. Persist per-entity JSON with detailed `steps`.
5. Write aggregate `summary.json` (optionally with per-step detail).
6. Write/overwrite `last-output.txt` for each folder execution (contains raw combined stdout/stderr of the most recent run).

## CLI Flags

- `--entities BellSchedules,StudentSchoolAttendanceEvents` Filter execution to listed folder entity names (directory names under `v4/<Group>`). Matches folder name only, not the `name` property.
- `--include-steps` Include per-step detail for each entity in aggregate `summary.json`. Without this flag, aggregate only contains per-entity totals.
- `--env <envName>` Override environment used for Bruno runs (defaults to `ci.ed-fi.org`). Warns if no matching `.bru` file is found in `bruno/Tests/environments`.

## Exit Codes

- `0`: All processed entities have zero failed assertions and no config errors.
- `1`: At least one entity has failed assertions OR config error steps.

## Output Artifacts

### Per-Entity JSON Structure

```jsonc
{
  "entity": "BellSchedules",
  "totalPass": 2,
  "totalFail": 17,
  "steps": [
    {
      "file": "bruno/Tests/v4/MasterSchedule/BellSchedules/01 - CREATE a BellSchedule.bru",
      "folder": "v4/MasterSchedule/BellSchedules",
      "status": "FAIL",
      "httpStatus": 400,
      "assertionsPassed": 0,
      "assertionsFailed": 1
    }
    // ... more steps
  ]
}
```

### Aggregate Summary (without steps)

```jsonc
{
  "generatedAt": "2025-10-29T02:19:35.626Z",
  "entities": [
    {
      "entity": "BellSchedules",
      "assertions": { "passed": 2, "failed": 17, "total": 19 }
    }
  ],
  "totals": {
    "entitiesProcessed": 1,
    "assertionsPassed": 2,
    "assertionsFailed": 17,
    "assertionsTotal": 19
  },
  "exitStatus": "FAIL"
}
```

### Aggregate Summary (with --include-steps)

Adds a `steps` array per entity mirroring a subset of per-entity JSON.

## Usage Examples

Run all configured entities (named configs only):

```powershell
node scripts/run-scenarios.cjs
```

Just BellSchedules (slim aggregate):

```powershell
node scripts/run-scenarios.cjs --entities BellSchedules
```

Run specific entities (folder names) including step details in the aggregate:

```powershell
node scripts/run-scenarios.cjs --entities BellSchedules,StudentAssessments --include-steps
```

Custom environment and include steps:

```powershell
node scripts/run-scenarios.cjs --env staging.ed-fi.org --include-steps
```

## Troubleshooting

- Raw output: Inspect `automation-testing/results/last-output.txt` for parsing anomalies.
- Config failures: Check each entity's `test-config.json` for `name` and `order` presence.
- Missing requests: Ensure paths in `order` are accurate and point to existing `.bru` files.
- Bruno CLI not found: Script automatically falls back to `npx`; ensure internet access for first run.

## Extending

Potential enhancements:

- Capture assertion messages (currently only counts).
- Add timing metrics aggregate.
- Support pattern filters (wildcards) for `--entities`.
- Archive historical outputs (timestamped directories).

## Maintenance Notes

- Keep placeholder keys unique to avoid unintended replacements.
- Avoid very large `order` lists from multiple folders—script consolidates per folder but excessive breadth may lengthen runs.

## License

Refer to repository LICENSE for usage terms.
