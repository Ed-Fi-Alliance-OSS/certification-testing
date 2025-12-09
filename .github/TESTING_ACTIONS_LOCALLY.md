# Testing GitHub Actions Locally

This guide explains how to test GitHub Actions workflows locally using `act`, focusing on our Bruno lint workflow.

## Quick Reference

```powershell
# Test Bruno lint workflow
cd certification-testing
act pull_request --artifact-server-path ./local-artifacts

# Direct linter test (fastest)
cd bruno; npm run lint:bru

# Check workflow syntax
act --list
```

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installing Act](#installing-act)
- [Basic Usage](#basic-usage)
- [Testing Our Bruno Lint Workflow](#testing-our-bruno-lint-workflow)
- [Understanding Artifacts](#understanding-artifacts)
- [Common Issues & Solutions](#common-issues--solutions)
- [Alternative Testing Methods](#alternative-testing-methods)

## Prerequisites

- Docker Desktop installed and running
- PowerShell or Command Prompt
- Access to this repository

## Installing Act

### Option 1: Using Scoop (Recommended for Windows)

```powershell
scoop install act
```

### Option 2: Using Chocolatey

```powershell
choco install act-cli
```

### Option 3: Manual Installation

1. Download the latest release from [nektos/act releases](https://github.com/nektos/act/releases)
2. Extract to a directory in your PATH
3. Verify installation: `act --version`

## Basic Usage

### Test All Workflows

```powershell
act
```

### Test Specific Events

```powershell
act pull_request  # Simulate PR events
act push          # Simulate push events
```

### Test Specific Workflows

```powershell
act pull_request -W .github/workflows/on-pullrequest-lint-bruno.yml
```

## Testing Our Bruno Lint Workflow

### Method 1: Full Workflow Test (Recommended)

```powershell
# Navigate to repository root
cd "C:\path\to\certification-testing"

# Run the Bruno lint workflow with artifact support
act pull_request --artifact-server-path ./local-artifacts
```

**What happens:**

- ✅ Checkout repository files
- ✅ Set up Node.js 20
- ✅ Install npm dependencies
- ✅ Run Bruno linter with JSON output
- ✅ Upload lint report to local artifact server
- ❌ PR comment step fails (expected - needs GitHub token)

### Method 2: Core Steps Only (Faster)

```powershell
# Skip GitHub-specific steps that require authentication
act pull_request --artifact-server-path ./local-artifacts --skip-job comment
```

### Method 3: Manual Validation (Simplest)

```powershell
# Navigate to bruno directory
cd bruno

# Run the exact same steps as the workflow
npm ci --no-audit --no-fund
node scripts/lint-bruno.cjs --json > lint-report.json

# Check results
$errors = (Get-Content lint-report.json | ConvertFrom-Json).summary.errors
if ($errors -eq 0) { 
    Write-Host "✅ Workflow would PASS (no errors)" 
} else { 
    Write-Host "❌ Workflow would FAIL ($errors errors)" 
}
```

## Understanding Artifacts

### What is `--artifact-server-path`?

GitHub Actions workflows often upload artifacts (files) for later use or download. When testing locally, `act` needs somewhere to store these files.

**Without this flag:**

```markdown
❌ Error: Unable to get the ACTIONS_RUNTIME_TOKEN env variable
```

**With this flag:**

```markdown
✅ Artifact bruno-lint-report has been successfully uploaded!
```

### Artifact Server Options

```powershell
# Store artifacts in temporary directory
act pull_request --artifact-server-path /tmp/artifacts

# Store artifacts in project directory  
act pull_request --artifact-server-path ./local-artifacts

# Skip artifact steps entirely
act pull_request --skip-job upload-lint-report
```

## Common Issues & Solutions

### 1. Docker Not Running

**Error:** `Cannot connect to the Docker daemon`
**Solution:** Start Docker Desktop

### 2. GitHub Token Required

**Error:** `Input required and not supplied: github-token`
**Solution:** This is expected for PR comment steps. Use `--skip-job` or ignore the error.

### 3. Path Issues in Container

**Error:** Linter shows 0 files scanned
**Solution:** The workflow is working correctly; Docker context may differ from local paths.

### 4. Permission Errors

**Error:** `Permission denied` on artifact paths
**Solution:** Use relative paths like `./local-artifacts` instead of `/tmp/artifacts`

### 5. Workflow Not Found

**Error:** `unable to find workflows`
**Solution:** Ensure you're in the repository root directory

## Alternative Testing Methods

### 1. Direct Linter Execution

```powershell
cd bruno
npm install
npm run lint:bru        # Human-readable output
npm run lint:bru:json   # JSON output (same as workflow)
```

### 2. Pre-commit Hook Testing

The linter runs automatically on git commits via `simple-git-hooks`:

```powershell
git add .
git commit -m "Test commit"  # Linter runs automatically
```

### 3. VS Code Extension

Install the GitHub Actions extension for VS Code to validate workflow syntax.

## Workflow Success Criteria

### Bruno Lint Workflow Passes When

- ✅ All `.bru` files have valid syntax
- ✅ No ERROR-level issues found
- ✅ Warnings are allowed (non-blocking)

### Common Validation Rules

1. **Meta blocks** required for request files with HTTP verbs
2. **Query parameters** recommended when URL contains `?`
3. **Descriptor URIs** should not be hardcoded in validation files
4. **Array/object assertions** should be consistent
5. **Variable tokens** required when using `validateDependency`
6. **Mutating verbs** forbidden in read-only "Check" files
7. **pickSingle usage** should match array assertions
8. **encodeUrl setting** required (either `true` or `false`)

## Troubleshooting Tips

### Check Workflow Status

```powershell
# View workflow file
Get-Content .github/workflows/lint-bruno.yml

# Check for syntax issues
act --list
```

### Debug Output

```powershell
# Verbose output
act pull_request --verbose

# Dry run (don't execute)
act pull_request --dry-run
```

### Manual Step Recreation

If `act` fails, recreate workflow steps manually:

1. **Setup:** Install Node.js 20
2. **Dependencies:** `npm ci --no-audit --no-fund`
3. **Lint:** `node scripts/lint-bruno.cjs --json`
4. **Validate:** Check for `errors: 0` in output

## Additional Resources

- [Act Documentation](https://github.com/nektos/act)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Bruno Documentation](https://docs.usebruno.com/)
- [Repository Bruno README](../bruno/README.md)

---
**Last Updated:** October 27, 2025  
**Applies to:** Bruno Lint Workflow (`on-pullrequest-lint-bruno.yml`)
