# Sample Data Bruno Collection

Holds sample data verification scenarios and tutorial flows.

## Local Dependencies
This collection maintains its own `node_modules` to satisfy Bruno sandbox module resolution limits.

Current dependencies:
- `dayjs`

## Utilities
`utils.js` mirrors the one in other collections. Keep them synchronized manually when changes are introduced.

## Add or Update a Dependency
```
npm install <package>
```

## Batch Updating
Run the root `update-collection-deps.ps1` script.

## Linting & Suppressions
This repo includes a custom Bruno linter (`node scripts/lint-bruno.cjs`).

Typical run from root:
```
npm run lint:bru
```

Auto-fix structural issues:
```
node scripts/lint-bruno.cjs --fix
```

### Suppression Directives
Because many Sample Data files intentionally omit `assert {}` blocks (they serve as raw examples), the linter allows inline suppression.

Add anywhere in a `.bru` file to disable all lint rules:
```
@bru-lint-disable all
```

Or disable only the pickSingle usage rule (code P001):
```
@bru-lint-disable P001
```

Automatic suppression: If a file resides under `Sample Data/` and has no `assert {}` block, rule P001 is ignored even without a directive.

Current rule codes:
- P001: pickSingle mismatch (either missing pickSingle when asserting array, or pickSingle present without array assertion)

Keep suppression usage minimal; prefer adding appropriate assertions in certification collections (e.g., SIS) rather than suppressing.

## MTSS sample data (sandbox-agnostic seeding)

`MTSS/` seeds everything the MTSS certification needs without depending on the populated
sandbox's students and staff. Each certification's sample data is encapsulated in its own
folder so one never affects the other (SIS will get its own `SIS/Dependencies` and
`SIS/Scenario Steps` later).

| Folder | Purpose |
| --- | --- |
| `MTSS/Dependencies/` | Run once, in order (Dep 1-11): our own school `9999999911` under LEA `255901`, students `99999911`/`99999912` with enrollments, staff `mtss-staff-01`/`02` with assignments, and the two provider descriptors. Persistent. |
| `MTSS/Reset/` | Deletes everything the MTSS scenarios create (Down 1-13, in order), from any state; 204 = deleted, 404 = not present. Run it to start a new pass from scratch. Dependencies are kept. |
| `MTSS/Scenario Steps/<scenario>/` | Vendor actions behind each MTSS certification scenario: `Step N` = the action checked by certification step N, `Sync N` = the "normal synchronization" re-POSTs for Recovery. |
| `Resources/<Entity> V5/` | Per-entity toolkit (Aux 1-5: lookup by natural key, POST template, PUT, GET by id, DELETE). New: Interventions, StudentInterventionAssociations, StudentInterventionAttendanceEvents, Cohorts V5, StaffCohortAssociations V5. |

**Environment prerequisites**

- The API client must be authorized for LEA `255901` (only referenced, never written; a 403
  lists the client's education organizations). That is the case on ci-v5 and on
  populated-template environments; elsewhere, change the LEA id in
  `MTSS/Dependencies/Dep 1` (the only place it appears).
- Set `providerNamespace` in the environment to one of the client's namespace prefixes
  (descriptor creation is authorized by namespace; a 403 "namespace-mismatch" lists them).
  `ci-v5.ed-fi.org` and `api.ed-fi.org` use `uri://gbisd.edu`.
- Ed-Fi default descriptors must be loaded (minimal/populated template or bulk load); the
  `Descriptors` scripts only read descriptors.

**Dependencies are not reset, by design:** with a relationship-based key a
student/staff member can't be deleted while enrolled/assigned (409), and deleting the
association first removes the relationship (403). A partial teardown would orphan people
and break the next run, so Dependencies are persistent and upserted each run; the MTSS
records built on them are fully removed by the MTSS scripts and CI cleanup.

**Run order (manual):** `MTSS/Reset` (to start from scratch) → `MTSS/Dependencies` → for each scenario in `MTSS/Scenario Steps`,
alternate `Step N` with certification step N in `bruno/MTSS`; for Recovery, run
certification steps 01-07 (PATH 1) or 01-08 (PATH 2), then the `Sync` scripts for your
path, then certification steps 09-14.

All creates are POSTs (natural-key upserts), so every script can be re-run.

CI (`scripts/run-scenarios.cjs --collection mtss`) runs these same scripts unchanged from
`bruno/Tests/v5/Intervention/*/test-config.json`, with `MTSS/Reset` first and last; `providerNamespace` comes from
`bruno/Tests/environments/ci-v5.ed-fi.org.bru`.
