# SIS Bruno Collection

This folder contains Bruno certification tests for SIS-facing Ed-Fi entities.

## Local Dependencies Strategy
Each collection maintains its own isolated `node_modules` because the Bruno sandbox restricts module resolution from traversing parent directories.

Installed dependencies:
- `dayjs` (date handling + optional UTC/timezone plugins)

## Utilities
`utils.js` provides shared helpers: descriptor extraction, logging, expectation wrappers, variable caching, dependency validation, etc.

## Adding a Dependency
From this folder (PowerShell or bash):
```
npm install <package-name>
```
Avoid global installs; keep everything local to the collection.

## Updating All Collections
Use the root script `update-collection-deps.ps1` (see repository root) to bump a dependency across collections.

## Notes
- Do not remove this folder's `package.json`; without it `require()` may fail.
- Keep `utils.js` in sync with other collections when adding new helpers.
