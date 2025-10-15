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
