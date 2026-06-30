# Ed-Fi Sample Data Script Generation Specification

**Version:** 1.0  
**Last Updated:** 2026-06-26  
**Status:** Active

This specification defines rules for generating Bruno sample data seed scripts for Ed-Fi ODS/API entities. These scripts live in `Sample Data/Resources/<EntityPlural> V<N>/` and are companion scripts to the read-only certification test scenarios in `SIS/v<N>/<EntityGroup>/<EntityFolder>/`.

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Inputs](#2-inputs)
3. [Output Folder Naming & Legacy Detection](#3-output-folder-naming--legacy-detection)
4. [Output Files Overview](#4-output-files-overview)
5. [Step-N File Rules (Data Seed)](#5-step-n-file-rules-data-seed)
6. [Aux-N File Rules (On-Demand Helpers)](#6-aux-n-file-rules-on-demand-helpers)
7. [Variable Naming Conventions](#7-variable-naming-conventions)
8. [Descriptor Encoding](#8-descriptor-encoding)
9. [Placeholder Format](#9-placeholder-format)
10. [Null & Empty Field Handling](#10-null--empty-field-handling)
11. [Sequence Numbering](#11-sequence-numbering)
12. [Consistency Checking](#12-consistency-checking)

---

## 1. Purpose & Scope

Sample data scripts seed test data into the Ed-Fi ODS/API so that read-only certification tests can validate it. The execution order interleaves sample data and certification steps:

```
Sample Data Step 1 → SIS Step 1 → Sample Data Step 2 → SIS Step 2 → ...
```

**In scope:**
- Generating `Step-N` and `Aux-N` `.bru` files in `Sample Data/Resources/<EntityPlural> V<N>/`
- Generating the minimal `folder.bru` for the output folder
- V4 and V5 entity support (version-agnostic rules)

**Out of scope:**
- Generating SIS certification test files (`SIS/v<N>/...`) — covered by `spec.md`
- Executing or running Bruno scripts

---

## 2. Inputs

### 2.1 Primary Input: `folder.bru` docs block

Located at `bruno/SIS/v<N>/<EntityGroup>/<EntityFolder>/folder.bru`.

Required sections parsed from the `docs {}` block:

| Section | Purpose |
|---------|---------|
| `## Scenarios tasks` | Defines scenario operations (`__CREATE__`, `__UPDATE__`, `__DELETE__`) and ordinals |
| `## Scenarios example data` | Tabular data: field names, types, required status, per-scenario values |

### 2.2 Secondary Input: `entity.config.json`

Located at `bruno/SIS/v<N>/<EntityGroup>/<EntityFolder>/entity.config.json`.

Key fields used:

| Field | Purpose |
|-------|---------|
| `identity.primaryKeyFields` | Determines which fields get `[ENTER ...]` placeholders in Aux files |
| `identity.naturalIdField` | Used as the primary Aux 1 query parameter when a single natural key exists |
| `identity.irregularPlural.singular` | Override for entity singular name |
| `overrides.entityName` | Override for entity singular name (highest precedence) |
| `overrides.endpointSegment` | Override for REST endpoint segment |

### 2.3 Version & Path Inference

| Component | Derivation |
|-----------|-----------|
| **version** | Extracted from path: `SIS/v5/...` → `5`, `SIS/v4/...` → `4` |
| **entityGroup** | Parent folder of entity (e.g. `StaffAssociation`) |
| **entityFolder** | Entity folder name (e.g. `Staffs`) |
| **entityPlural** | `entityFolder` value, used as-is for file names |
| **entitySingular** | 1. `overrides.entityName` → 2. `identity.irregularPlural.singular` → 3. Remove trailing `s` from `entityFolder` |
| **endpointSegment** | 1. `overrides.endpointSegment` → 2. `identity.irregularPlural.endpointSegment` → 3. Lowercase first letter of `entityFolder` |

---

## 3. Output Folder Naming & Legacy Detection

### 3.1 Standard Naming

- **V5:** `bruno/Sample Data/Resources/<EntityPlural> V5/`
- **V4:** `bruno/Sample Data/Resources/<EntityPlural> V4/`

`<EntityPlural>` matches the `entityFolder` name exactly (e.g. `Staffs`, `GradingPeriods`).

### 3.2 Legacy Detection

Before generating, check if a folder named `Sample Data/Resources/<EntityPlural>/` (without version suffix) already exists.

**If found:** Pause and notify the user:

> "A legacy folder `<EntityPlural>` already exists without a version suffix. Before continuing, please confirm: should I (A) rename it to `<EntityPlural> V<N>`, (B) delete it and generate a fresh `<EntityPlural> V<N>` folder from scratch, or (C) keep it as-is and generate a new `<EntityPlural> V<N>` folder?"

Do not proceed until the user responds.

**If the versioned target folder already exists:** Pause and ask:

> "The folder `<EntityPlural> V<N>` already exists. Should I (A) overwrite its contents, or (B) abort?"

### 3.3 Output `folder.bru`

Generate a minimal `folder.bru` in the output folder:

```
meta {
  name: <EntityPlural> V<N>
  seq: <NEXT_SEQ>
}

auth {
  mode: inherit
}
```

`<NEXT_SEQ>`: inspect all existing `folder.bru` files in `Sample Data/Resources/` and use `max(seq) + 1`. If none found, default to `1`.

---

## 4. Output Files Overview

All generated files live in `Sample Data/Resources/<EntityPlural> V<N>/`:

| File | Method | seq | Body data | Purpose |
|------|--------|-----|-----------|---------|
| `Aux 1 - <EntityPlural>.bru` | GET | 1 | All PK fields as placeholders | Query by natural key |
| `Aux 2 - <EntityPlural>.bru` | POST | 2 | PK fields as placeholders; non-PK from Scenario 1 | Create helper |
| `Aux 3 - <EntityPlural>.bru` | PUT | 3 | PK fields as placeholders; non-PK from Scenario 1 | Update helper |
| `Aux 4 - <EntityPlural> by Id.bru` | GET | 4 | No body | Fetch by UUID |
| `Aux 5 - <EntityPlural>.bru` | DELETE | 5 | No body | Delete helper |
| `Step 1 - <EntityPlural>.bru` | POST or PUT | 6 | Scenario 1 values | First data seed step |
| `Step 2 - <EntityPlural>.bru` | POST or PUT | 7 | Scenario 2 values | Second data seed step |
| `Step N - <EntityPlural>.bru` | POST or PUT | 5+N | Scenario N values | Nth data seed step |

---

## 5. Step-N File Rules (Data Seed)

### 5.1 Scenario Numbering

Steps are numbered by **execution order** (position in the `## Scenarios tasks` list, top to bottom), **not** by the numeric label on the task line. This prevents bugs from out-of-order or misnumbered task lists in `folder.bru`.

**Example:** If the task list reads `1, 2, 4, 5, 3, 6`, the generated files are still `Step 1` through `Step 6` based on position.

### 5.2 HTTP Method

| Task token | HTTP Method |
|------------|-------------|
| `__CREATE__` | POST |
| `__UPDATE__` | PUT |
| `__DELETE__` | DELETE |

### 5.3 URL Construction

- **POST:** `{{resourceBaseUrl}}/ed-fi/<endpointSegment>`
- **PUT / DELETE:** `{{resourceBaseUrl}}/ed-fi/<endpointSegment>/{{temp<Ordinal><EntitySingular>UUID}}`

`<Ordinal>` is the capitalized ordinal referenced in the task line (e.g. `__UPDATE__ ... the 'first' added ...` → `First`).

### 5.4 Request Body — POST (`__CREATE__`)

Include all fields from the corresponding scenario column that are **REQUIRED** or **CONDITIONAL**:
- Descriptor fields: encode as `uri://ed-fi.org/<DescriptorType>#<value>` (see Section 8)
- Empty/blank scenario values for REQUIRED or CONDITIONAL fields: use `null` (see Section 10)
- OPTIONAL fields with empty/blank values: omit entirely

### 5.5 Request Body — PUT (`__UPDATE__`)

Same as POST body rules, plus:
- Include `"id": "{{temp<Ordinal><EntitySingular>UUID}}"` as the **first field** in the body
- Use the PUT scenario column values

### 5.6 `script:post-response` (POST steps only)

```javascript
script:post-response {
  const locationHeader = res.headers.Location || res.headers.location;
  if (locationHeader) {
    const _UUID = locationHeader.split('/').pop();
    bru.setVar('temp<Ordinal><EntitySingular>UUID', _UUID);
    console.log('<EntitySingular> data was created correctly.');
  }
}
```

- Local capture variable is always named `_UUID`
- Stored Bruno variable: `temp<Ordinal><EntitySingular>UUID` (e.g. `tempFirstStaffUUID`, `tempThirdGradingPeriodUUID`)
- PUT and DELETE steps do **not** include a `script:post-response`

### 5.7 Auth & Settings

Every Step file includes:

```
auth:bearer {
  token: {{edFiCertToken}}
}

settings {
  encodeUrl: true
  timeout: 0
}
```

### 5.8 Full Step File Template

```
meta {
  name: Step <N> - <EntityPlural>
  type: http
  seq: <5+N>
}

<method> {
  url: <url>
  body: json
  auth: bearer
}

auth:bearer {
  token: {{edFiCertToken}}
}

body:json {
  {
    <fields>
  }
}

<script:post-response if POST>

settings {
  encodeUrl: true
  timeout: 0
}
```

---

## 6. Aux-N File Rules (On-Demand Helpers)

Aux files are manually-executed helpers, not part of the automated sequence. The user edits placeholder values before running them.

### 6.1 Aux 1 — GET by Query Parameters

- Method: GET
- URL: `{{resourceBaseUrl}}/ed-fi/<endpointSegment>?<PKparams>`
- `params:query {}` block mirrors the URL parameters exactly
- **All PK fields** → `[ENTER FIELD NAME]` placeholder (see Section 9)
- **Descriptor PK fields** → also use the sentinel pattern (see Section 8.2)

`script:post-response` — always present, captures UUID using `pickSingle()`:

```javascript
script:post-response {
  const { setVar, setVarsMessage, wipeVar, wipeVarsWarning, pickSingle } = require('./utils');
  const item = pickSingle(res.getBody());
  
  if (item) {
    setVar(bru, 'temp<EntitySingular>UUID', item.id);
    setVarsMessage('<EntitySingular>');
  } else {
    wipeVar(bru, 'temp<EntitySingular>UUID');
    wipeVarsWarning('<EntitySingular>');
  }
}
```

Note: The Aux UUID variable has **no ordinal** — it is a single working copy for ad-hoc use.

### 6.2 Aux 2 — POST (Create Helper)

- Method: POST
- Body: JSON with all REQUIRED and CONDITIONAL fields:
  - PK fields → `[ENTER FIELD NAME]` placeholders
  - Non-PK fields → **exact Scenario 1 values** (fully encoded; user updates as needed)
  - OPTIONAL fields → omit

`script:post-response` — captures UUID into `temp<EntitySingular>UUID`:

```javascript
script:post-response {
  const locationHeader = res.headers.Location || res.headers.location;
  if (locationHeader) {
    const _UUID = locationHeader.split('/').pop();
    bru.setVar('temp<EntitySingular>UUID', _UUID);
    console.log('<EntitySingular> data was created correctly.');
  }
}
```

### 6.3 Aux 3 — PUT (Update Helper)

- Method: PUT
- URL: `{{resourceBaseUrl}}/ed-fi/<endpointSegment>/{{temp<EntitySingular>UUID}}`
- Body: same structure as Aux 2, plus `"id": "{{temp<EntitySingular>UUID}}"` as the **first field**
  - PK fields → `[ENTER FIELD NAME]` placeholders
  - Non-PK fields → Scenario 1 values
- No `script:post-response`

### 6.4 Aux 4 — GET by Id

- Method: GET
- URL: `{{resourceBaseUrl}}/ed-fi/<endpointSegment>/{{temp<EntitySingular>UUID}}`
- No body, no scripts

### 6.5 Aux 5 — DELETE

- Method: DELETE
- URL: `{{resourceBaseUrl}}/ed-fi/<endpointSegment>/{{temp<EntitySingular>UUID}}`
- No body, no scripts

### 6.6 Auth & Settings (All Aux Files)

```
auth:bearer {
  token: {{edFiCertToken}}
}

settings {
  encodeUrl: true
  timeout: 0
}
```

---

## 7. Variable Naming Conventions

| Variable | Pattern | Example |
|----------|---------|---------|
| Step POST UUID | `temp<Ordinal><EntitySingular>UUID` | `tempFirstStaffUUID` |
| Aux UUID (no ordinal) | `temp<EntitySingular>UUID` | `tempStaffUUID` |
| Local capture variable | `_UUID` (always this name) | `const _UUID = locationHeader.split('/').pop()` |
| Descriptor sentinel (Aux 1) | `temp<FieldNamePascal>Encoded` | `tempGradingPeriodDescriptorEncoded` |

**Ordinal capitalization (authoritative list):**

| Position | Capitalized | Lowercase |
|----------|-------------|-----------|
| 1 | `First` | `first` |
| 2 | `Second` | `second` |
| 3 | `Third` | `third` |
| 4 | `Fourth` | `fourth` |
| 5 | `Fifth` | `fifth` |
| 6 | `Sixth` | `sixth` |
| 7 | `Seventh` | `seventh` |
| 8 | `Eighth` | `eighth` |
| 9 | `Ninth` | `ninth` |
| 10 | `Tenth` | `tenth` |

---

## 8. Descriptor Encoding

### 8.1 Body Values

Descriptor field values in request bodies are encoded as:

```
uri://ed-fi.org/<DescriptorType>#<value>
```

`<DescriptorType>` is the field name with the first letter uppercased:

| Field name | Encoded type |
|------------|-------------|
| `sexDescriptor` | `SexDescriptor` |
| `gradingPeriodDescriptor` | `GradingPeriodDescriptor` |
| `highestCompletedLevelOfEducationDescriptor` | `HighestCompletedLevelOfEducationDescriptor` |
| `electronicMailTypeDescriptor` | `ElectronicMailTypeDescriptor` |

**Full example:** `"uri://ed-fi.org/SexDescriptor#Male"`

### 8.2 Aux 1 Sentinel Pattern (Descriptor as PK Query Parameter)

When a descriptor field appears in `identity.primaryKeyFields`, it must use the sentinel pattern in Aux 1 to handle URL encoding correctly:

```
params:query {
  <descriptorField>: {{temp<FieldNamePascal>Encoded}}
  <descriptorField>_KEEP_IT_AT_THE_END: [ENTER DESCRIPTOR VALUE]
}

script:pre-request {
  const { encodeDescriptorParameter } = require('./utils');
  const encoded = encodeDescriptorParameter(req.url, '<descriptorField>_KEEP_IT_AT_THE_END');
  bru.setVar('temp<FieldNamePascal>Encoded', encoded);
}
```

If no PK field is a descriptor type, the sentinel pattern and `script:pre-request` are omitted entirely from Aux 1.

---

## 9. Placeholder Format

All placeholder values use the format:

```
[ENTER FIELD NAME]
```

Rules:
- Words separated by **spaces** (never underscores)
- **All uppercase**
- Derived by splitting the camelCase field name on word boundaries

| Field name | Placeholder |
|------------|-------------|
| `schoolId` | `[ENTER SCHOOL ID]` |
| `staffUniqueId` | `[ENTER STAFF UNIQUE ID]` |
| `beginDate` | `[ENTER BEGIN DATE]` |
| `gradingPeriodDescriptor` | `[ENTER GRADING PERIOD DESCRIPTOR]` |
| `educationOrganizationId` | `[ENTER EDUCATION ORGANIZATION ID]` |

---

## 10. Null & Empty Field Handling

| Scenario | Rule |
|----------|------|
| REQUIRED field — empty/blank scenario column value | Include field with `null` value |
| CONDITIONAL field — empty/blank scenario column value | Include field with `null` value |
| OPTIONAL field — empty/blank scenario column value | Omit field entirely |
| Field not listed in data table | Omit field entirely |

---

## 11. Sequence Numbering

| File | `seq` value |
|------|-------------|
| `Aux 1` | `1` |
| `Aux 2` | `2` |
| `Aux 3` | `3` |
| `Aux 4` | `4` |
| `Aux 5` | `5` |
| `Step N` | `5 + N` |
| `folder.bru` | `max(existing seq values in Sample Data/Resources/) + 1` |

---

## 12. Consistency Checking

Before generating any files, validate all inputs. **Pause and ask the user** whenever any of the following conditions are found. Never assume — inconsistencies may be intentional or typos. The user must confirm before the skill proceeds.

| Check | Action on issue |
|-------|----------------|
| Task list numbering is not sequential by position (e.g. `1, 2, 4, 5, 3, 6`) | Warn user; confirm that execution-order position will be used for Step numbering |
| Scenario column count in data table does not match task count | Pause; ask user to confirm expected count |
| A REQUIRED field has no value in any scenario column (not blank — completely absent from the table) | Pause; ask for the correct value before generating |
| Descriptor field value is present but does not use a recognizable short-form (e.g. contains `uri://` — already encoded) | Pause; confirm whether to use as-is or re-encode |
| A PK field listed in `entity.config.json` is not present as a column in the data table | Pause; flag the missing field; ask how to handle it |
| A PUT scenario column references an ordinal whose CREATE step does not exist | Pause; flag the inconsistency |
| Output folder already exists in any form (with or without version suffix) | Pause; ask user whether to overwrite, rename, or abort (see Section 3.2) |
| Any pattern in existing reference files for this entity deviates from this spec | Surface the deviation explicitly; ask user to confirm canonical behavior before replicating or correcting it |

**Principle:** If in doubt, stop and ask. It is always better to pause for a 10-second clarification than to generate files with a baked-in assumption that later causes a test failure.
