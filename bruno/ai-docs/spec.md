# Ed-Fi Read-Only Certification Scenario Generation Specification

**Version:** 1.0  
**Last Updated:** October 24, 2025  
**Status:** Active

This specification provides comprehensive requirements for generating Bruno (.bru) read-only certification test scenarios for Ed-Fi ODS/API entities. Generation is driven by:

1. Entity documentation in `folder.bru` (`docs {}` block)
2. Machine-readable configuration in `entity.config.json`
3. Folder path conventions for entity inference
4. Shared utility libraries (`utils.js`, `logging.js`)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure & Path Inference](#2-folder-structure--path-inference)
3. [Configuration File (`entity.config.json`)](#3-configuration-file-entityconfigjson)
4. [Documentation Parsing (`folder.bru`)](#4-documentation-parsing-folderbru)
5. [Scenario Types & File Naming](#5-scenario-types--file-naming)
6. [Variable Naming Conventions](#6-variable-naming-conventions)
7. [URL Construction & Query Parameters](#7-url-construction--query-parameters)
8. [Descriptor Parameter Encoding (Sentinel Pattern)](#8-descriptor-parameter-encoding-sentinel-pattern)
9. [Assertion Strategy](#9-assertion-strategy)
10. [Script Blocks](#10-script-blocks)
11. [Logging Requirements](#11-logging-requirements)
12. [Error Handling](#12-error-handling)
13. [Formatting Standards](#13-formatting-standards)
14. [Ambiguity Escalation](#14-ambiguity-escalation)
15. [Generation Checklist](#15-generation-checklist)

---

## 1. Architecture Overview

### 1.1 Core Principles

- **Config-Driven**: Minimal configuration (`entity.config.json`) captures only non-inferable data (primary keys, natural ID)
- **Doc-Driven**: Entity documentation (`folder.bru` docs block) defines scenarios, example data, and API response structure
- **Convention-over-Configuration**: Folder names, path structure, and naming patterns drive automatic inference
- **Zero Manual Scaffolding**: Scenarios generate complete without additional user input (except data placeholders)

### 1.2 File Dependencies

Each entity folder must contain:

```markdown
<EntityFolder>/
├── folder.bru              # Entity docs + scenario tasks
├── entity.config.json      # Primary keys + optional overrides
├── NN - Check ....bru      # Generated scenario files (baseline & updates)
```

Shared collection-level utilities:

```markdown
<Collection>/
├── utils.js                # Core helper functions
├── logging.js              # Entity-specific log specifications
├── environments/           # Bruno environment files
```

Schema reference: `schemas/entity-config.schema.json`

---

## 2. Folder Structure & Path Inference

### 2.1 Path Pattern

Standard entity path structure:

```markdown
./SIS/v4/<EntityGroup>/<EntityFolder>/
```

**Example:**

```markdown
./SIS/v4/EducationOrganizationCalendar/CalendarDates/
```

### 2.2 Inference Rules

| Component | Derivation | Example |
|-----------|------------|---------|
| **baseFolderPath** | Path up to version | `./SIS/v4` |
| **entityGroup** | Parent folder of entity | `EducationOrganizationCalendar` |
| **entityFolder** | Plural PascalCase folder name | `CalendarDates` |
| **entityName** (singular) | Remove trailing 's' from entityFolder | `CalendarDate` |
| **endpoint segment** | Lowercase first letter, keep rest intact | `calendarDates` |

### 2.3 Irregular Pluralization

For entities with non-standard plurals (Person → People, StaffLeave → StaffLeaves), use `identity.irregularPlural` in config:

```json
{
  "version": 1,
  "identity": {
    "primaryKeyFields": ["personId"],
    "irregularPlural": {
      "singular": "Person",
      "plural": "People",
      "endpointSegment": "people"
    }
  }
}
```

**Rules when `irregularPlural` present:**

- Use `singular` for variable stems (`firstPersonUniqueId`)
- Use `plural` for folder name validation
- Use `endpointSegment` (or camelCase plural if omitted) for URL construction

---

## 3. Configuration File (`entity.config.json`)

### 3.1 Schema Location

`schemas/entity-config.schema.json`

### 3.2 Minimal Required Structure

```json
{
  "$schema": "../../../schemas/entity-config.schema.json",
  "version": 1,
  "identity": {
    "primaryKeyFields": ["schoolId", "schoolYear", "calendarCode", "date"],
    "naturalIdField": "calendarCode"
  }
}
```

### 3.3 Property Definitions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | integer | ✅ | Config schema version (currently 1) |
| `identity.primaryKeyFields` | array[string] | ✅ | Ordered list of primary key fields for query construction |
| `identity.naturalIdField` | string \| null | ⚪ | Single human-readable identifier field (optional) |
| `identity.irregularPlural` | object | ⚪ | Override for non-standard singular/plural forms |
| `overrides.baselineLabels` | array[string] | ⚪ | Custom ordinal labels (future extension) |
| `overrides.suppressAssertions` | array[string] | ⚪ | Field paths to skip assertion even if required (future) |
| `overrides.forceOptionalAsRequired` | array[string] | ⚪ | Optional fields to treat as required (future) |

### 3.4 Primary Key Field Ordering

**CRITICAL:** The order of `primaryKeyFields` is authoritative for query string construction. Fields appear in the query string in the same order listed in the config.

**Example:**

```json
"primaryKeyFields": ["schoolId", "schoolYear", "calendarCode", "date"]
```

→ Query: `?schoolId=X&schoolYear=Y&calendarCode=Z&date=W`

---

## 4. Documentation Parsing (`folder.bru`)

### 4.1 Required Sections

Each `folder.bru` `docs {}` block must include these public sections:

#### **`## Scenarios tasks`**

Defines baseline creation and update scenarios using special tokens.

**Format:**

```markdown
1. __CREATE__ the `first` [description] <EntityName>
2. __CREATE__ the `second` [description] <EntityName>
3. __UPDATE__ the _fieldName_ on the `first` added <EntityName>
4. __DELETE__ the `first` <EntityName>
```

**Tokens:**

- `__CREATE__` → baseline scenario
- `__UPDATE__` → update scenario
- `__DELETE__` → deletion verification scenario
- `` `first` ``, `` `second` ``, `` `third` `` → ordinal identifiers
- `_fieldName_` → mutable field (underscored/italic in Markdown)

#### **`## Scenarios example data`**

Tabular data mapping with columns:

| Column | Purpose |
|--------|---------|
| Resource | Root entity or nested object name |
| Property Name | Field name |
| Is Collection | TRUE if array type |
| Data Type | Ed-Fi type name |
| **Required** | `REQUIRED`, `OPTIONAL`, or `CONDITIONAL` |
| Scenario N: POST/PUT | Example values per scenario |

#### **`## API response format`**

JSON sample showing actual response structure (fallback for nested paths).

### 4.2 Scenario Inference from Tasks

#### 4.2.1 Baseline Detection

- Line contains `__CREATE__`
- Extract ordinal: `first`, `second`, `third`, `fourth`, `fifth`, `sixth`, etc.
- Variable prefix: `<ordinal><EntityName>` (e.g., `firstCalendarDate`)

#### 4.2.2 Update Detection

- Line contains `__UPDATE__`
- Extract ordinal reference (which baseline this updates)
- Extract mutable fields: all `_underscored_` tokens

**Example:**

```markdown
3. __UPDATE__ the _calendarEventDescriptor_ on the `first` added `Calendar date`
```

→ Update scenario references `firstCalendarDate` and mutates `calendarEventDescriptor`

#### 4.2.3 Delete Detection

- Line contains `__DELETE__`
- Extract ordinal reference
- No mutable fields (deletion is state change, not data mutation)

### 4.3 Mutable Field Detection

**Rules for underscored tokens:**

1. **Descriptor Fields**: Token contains substring `descriptor` (case-insensitive)
   - Always normalize with `extractDescriptor()` when caching
   - Cache baseline value, compare in update
   - Example: `_termDescriptor_` → cache as `firstCourseTranscriptTermDescriptor`

2. **Nested Collection Fields**: Token refers to property inside collection
   - Example: `meetingTimes.startTime`
   - Cache using index `[0]` heuristic: `entity.meetingTimes[0].startTime`
   - Variable naming uses **leaf field only**: `secondClassPeriodStartTime`
   - Assertions validate collection presence before dereferencing
   - If ambiguous (multiple collections contain field), trigger escalation (Section 14)

3. **Multiple Mutations in Single Update**: Preserve discovery order
   - Join for filename with conjunction rules (Section 5.2)

### 4.4 Field Classification (Required/Optional/Conditional)

From `## Scenarios example data` table, interpret `Required` column values:

| Value | Assertion Behavior | Mutation Behavior | Logging Behavior |
|-------|-------------------|-------------------|------------------|
| `REQUIRED` | ✅ Always assert presence & type | Cache + compare if mutated | Always log |
| `OPTIONAL` | ❌ **Never assert** | Cache + compare if mutated | Log if present |
| `CONDITIONAL` | ❌ **Never assert** | Cache + compare if mutated | Log if present |

**CRITICAL RULES:**

1. **Assertions:** OPTIONAL and CONDITIONAL fields are **NEVER asserted** (no presence, type, or value checks in `assert {}` blocks)
2. **Mutations:** If an OPTIONAL or CONDITIONAL field changes between scenarios for the same ordinal entity, cache the baseline value and use `expectChanged()` in update scripts
3. **Logging:** Log OPTIONAL/CONDITIONAL fields when they are present in the response to provide visibility, especially when mutated
4. **Detection:** A field is considered mutated if values differ across scenario columns for the same ordinal in the example data table (e.g., Scenario 2 POST vs Scenario 4 PUT both reference the `second` entity)

#### 4.4.1 Collection Handling

- **REQUIRED collections:** Assert `isArray` + `isNotEmpty`
- **OPTIONAL/CONDITIONAL collections:** Never assert, even if element mutated
  - If collection or element field mutated → cache baseline value and compare in update script
  - For descriptor collections: use helper functions (`mapDescriptors()`, `joinDescriptors()`)
  - For non-descriptor collections: cache appropriate representation (e.g., JSON.stringify, length, specific field values)
  - Log the collection in both baseline (if present) and update scenarios for visibility
  
**Example:** `gradeLevels` (CONDITIONAL descriptor collection)

- Baseline (Scenario 2): Cache `secondCalendarGradeLevelDescriptorList` = "Ninth grade"
- Update (Scenario 4): Compare cached value vs current = "Ninth grade, Tenth grade"
- No assertions for `gradeLevels` in either scenario
- Log `gradeLevels` in both scenarios since it's present

**Example:** `cumulativeEarnedCredits` (OPTIONAL numeric field)

- Baseline: Cache `firstStudentAcademicRecordCumulativeEarnedCredits` = 24
- Update: Compare cached value vs current = 28
- No assertions for field in either scenario
- Log in update scenario since it was mutated

#### 4.4.2 Primary Key Fields

Primary key fields should always be `REQUIRED`. If marked otherwise, escalate (Section 14).

---

## 5. Scenario Types & File Naming

### 5.1 Scenario Ordering

Files are numbered sequentially (`NN`):

1. All baselines in ordinal order
2. All updates in ordinal reference order
3. All deletes in ordinal reference order

**Example sequence:**

```markdown
01 - Check first CalendarDate is valid.bru
02 - Check second CalendarDate is valid.bru
03 - Check first CalendarDate calendarEventDescriptor was Updated.bru
04 - Check second CalendarDate calendarEventDescriptor was Updated.bru
05 - Check first CalendarDate was Deleted.bru
```

### 5.2 Baseline File Name Pattern

```markdown
NN - Check <ordinal> <EntityName> is valid.bru
```

**Examples:**

```markdown
01 - Check first CalendarDate is valid.bru
02 - Check second CourseTranscript is valid.bru
```

### 5.3 Update File Name Pattern (Property-Aware)

```markdown
NN - Check <ordinal> <EntityName> <PropertyList> was Updated.bru
```

**Property List Rules:**

- Use **leaf token only** (e.g., `meetingTimes.startTime` → `startTime`)
- Preserve exact casing from docs (camelCase assumed)
- No humanization (no spaces inserted inside tokens)

**Multiple properties:**

- **2 properties:** `<PropA> and <PropB>`
- **3+ properties:** `<PropA>, <PropB>, <PropC>` (Oxford comma optional)
- Always use singular verb: `was Updated` (uniform pattern)

**Examples:**

```markdown
03 - Check first ClassPeriod classPeriodName was Updated.bru
04 - Check second ClassPeriod startTime and endTime was Updated.bru
05 - Check third CourseOffering localCourseTitle was Updated.bru
```

### 5.4 Delete File Name Pattern

```markdown
NN - Check <ordinal> <EntityName> was Deleted.bru
```

**Example:**

```markdown
05 - Check first StudentSchoolAssociation was Deleted.bru
```

---

## 6. Variable Naming Conventions

### 6.1 Standard Variable Types

| Variable Type | Pattern | Example |
|--------------|---------|---------|
| Unique ID (mandatory) | `<ordinal><EntityName>UniqueId` | `firstCalendarDateUniqueId` |
| Natural ID (optional) | `<ordinal><EntityName>Id` | `firstCalendarDateId` |
| Mutable field | `<ordinal><EntityName><FieldName>` | `firstCourseTranscriptFinalNumericGradeEarned` |
| Descriptor field | `<ordinal><EntityName><DescriptorField>` | `firstCalendarDateCalendarEventDescriptorList` |
| Encoded descriptor param | `<ordinal><DescriptorParam>Encoded` | `firstTermDescriptorEncoded` |

### 6.2 Capitalization Rules

1. Take field segment from docs
2. Uppercase first letter (camelCase → PascalCase)
3. Append to ordinal prefix

**Examples:**

- `classPeriodName` → `firstClassPeriodClassPeriodName`
- `finalNumericGradeEarned` → `firstCourseTranscriptFinalNumericGradeEarned`

### 6.3 Descriptor List Variables

When caching descriptor collections (e.g., `calendarEvents`), use helper functions and append `List`:

```javascript
const descriptors = joinDescriptors(
  mapDescriptors(single.calendarEvents || [], ev => ev.calendarEventDescriptor)
);
setVars(bru, {
  firstCalendarDateCalendarEventDescriptorList: descriptors
});
```

---

## 7. URL Construction & Query Parameters

### 7.1 Baseline Scenarios (Collection Query)

Use primary key fields from config to build collection GET:

```markdown
GET {{resourceBaseUrl}}/ed-fi/<endpoint>?pk1={{value1}}&pk2={{value2}}
```

**Template with placeholders:**

```markdown
GET {{resourceBaseUrl}}/ed-fi/calendarDates?schoolId=[ENTER FIRST SCHOOL ID]&schoolYear=[ENTER FIRST SCHOOL YEAR]&calendarCode=[ENTER FIRST CALENDAR CODE]&date=[ENTER FIRST DATE YYYY-MM-DD]
```

### 7.2 Update Scenarios (Single Resource)

Use cached unique ID:

```markdown
GET {{resourceBaseUrl}}/ed-fi/<endpoint>/{{<ordinal><EntityName>UniqueId}}
```

**Example:**

```markdown
GET {{resourceBaseUrl}}/ed-fi/calendarDates/{{firstCalendarDateUniqueId}}
```

**Rationale:** Single-resource retrieval is more reliable and avoids query ambiguity.

### 7.3 Delete Scenarios (Single Resource)

Same pattern as updates:

```markdown
GET {{resourceBaseUrl}}/ed-fi/<endpoint>/{{<ordinal><EntityName>UniqueId}}
```

Expected response: `404 Not Found` (deletion verified by absence).

### 7.4 Params Block

Include `params:query` for user-editable placeholders:

```javascript
params:query {
  schoolId: [ENTER FIRST SCHOOL ID]
  schoolYear: [ENTER FIRST SCHOOL YEAR]
  calendarCode: [ENTER FIRST CALENDAR CODE]
  date: [ENTER FIRST DATE YYYY-MM-DD]
}
```

---

## 8. Descriptor Parameter Encoding (Sentinel Pattern)

### 8.1 Problem Context

Some Ed-Fi descriptor query parameters require full URIs with `#` fragments:

```markdown
uri://ed-fi.org/TermDescriptor#Fall Semester
```

Browsers/HTTP tooling treat `#` as a fragment delimiter, preventing transmission unless percent-encoded (`%23`). Bruno's automatic encoding can be unpredictable.

### 8.2 Sentinel Encoding Pattern (Required)

For any descriptor parameter with `#` fragment:

1. **Provide TWO query parameters:**
   - Actual API parameter: `<descriptorParam>={{<ordinal>DescriptorParamEncoded}}`
   - Sentinel raw parameter (LAST): `<descriptorParam>_KEEP_IT_AT_THE_END=<rawDescriptorValue>`

2. **Naming Convention:** Sentinel MUST append `_KEEP_IT_AT_THE_END` (case-sensitive) to original parameter name

3. **Pre-request Script:** Extract raw value from sentinel, encode, store in variable

4. **Settings Block:** Add `encodeUrl: false` to prevent Bruno re-encoding

### 8.3 Implementation Example

**URL Block:**

```javascript
get {
  url: {{resourceBaseUrl}}/ed-fi/courseTranscripts?educationOrganizationId=255901001&courseCode=ALG-01&termDescriptor={{firstTermDescriptorEncoded}}&termDescriptor_KEEP_IT_AT_THE_END=uri://ed-fi.org/TermDescriptor#Fall Semester
  body: none
  auth: inherit
}
```

**Params Block:**

```javascript
params:query {
  educationOrganizationId: [ENTER_EDUCATION_ORGANIZATION_ID]
  courseCode: [ENTER_COURSE_CODE]
  termDescriptor: {{firstTermDescriptorEncoded}}
  termDescriptor_KEEP_IT_AT_THE_END: [ENTER_TERM_DESCRIPTOR]
}
```

**Pre-Request Script:**

```javascript
script:pre-request {
  const { encodeDescriptorParameter, setVar } = require('./utils');
  const encoded = encodeDescriptorParameter(
    req.url,
    'termDescriptor_KEEP_IT_AT_THE_END',
    'uri://ed-fi.org/TermDescriptor#Fall Semester'
  );
  setVar(bru, 'firstTermDescriptorEncoded', encoded);
}
```

**Settings Block:**

```javascript
settings {
  encodeUrl: false
  timeout: 0
}
```

### 8.4 Variable Naming for Encoded Descriptors

Follow ordinal prefix rules:

- `firstTermDescriptorEncoded`
- `secondTermDescriptorEncoded`

If multiple distinct descriptor parameters in one scenario, append semantic suffix:

- `firstSessionTermDescriptorEncoded`

### 8.5 Multiple Descriptor Sentinels

Each descriptor gets its own sentinel pair:

```javascript
...&termDescriptor={{firstTermDescriptorEncoded}}&termDescriptor_KEEP_IT_AT_THE_END=uri://ed-fi.org/TermDescriptor#Fall Semester&sessionDescriptor={{firstSessionDescriptorEncoded}}&sessionDescriptor_KEEP_IT_AT_THE_END=uri://ed-fi.org/SessionDescriptor#2024-2025
```

Process sequentially in pre-request script.

### 8.6 Utility Functions

Two helpers must exist in `utils.js`:

#### `encodeDescriptorUri(rawDescriptor)`

Low-level fragment encoder (internal use):

```javascript
function encodeDescriptorUri(rawDescriptor) {
  if (typeof rawDescriptor !== 'string' || !rawDescriptor.trim()) return rawDescriptor;
  if (/%23/.test(rawDescriptor)) return rawDescriptor; // already encoded
  const parts = rawDescriptor.split('#');
  if (parts.length < 2) return rawDescriptor; // no fragment
  const prefix = parts.slice(0, -1).join('#');
  const fragment = parts[parts.length - 1];
  return `${prefix}%23${encodeURIComponent(fragment)}`;
}
```

#### `encodeDescriptorParameter(originalUrl, parameterName, defaultDescriptorValue)`

High-level parameter extractor + encoder (preferred):

```javascript
function encodeDescriptorParameter(originalUrl, parameterName, defaultDescriptorValue = '') {
  let raw = defaultDescriptorValue;
  if (originalUrl.includes('?')) {
    const qs = originalUrl.split('?')[1];
    for (const part of qs.split('&')) {
      const [k, v] = part.split('=');
      if (k === parameterName && v) {
        try { raw = decodeURIComponent(v); } catch { raw = v; }
        break;
      }
    }
  }
  const encoded = raw.includes('#') && !/%23/.test(raw) ? encodeDescriptorUri(raw) : raw;
  return encoded;
}
```

---

## 9. Assertion Strategy

### 9.1 Core Principles

Baseline assertions validate **structural presence only** for REQUIRED fields. Never assert OPTIONAL or CONDITIONAL fields.

### 9.2 Baseline Assertions (Collection Response)

```javascript
assert {
  res.status: eq 200
  res.body: isArray
  res.body: isNotEmpty
  res.body[0].id: isString
  res.body[0].id: isNotEmpty
  <required field assertions>
}
```

### 9.3 Field-Specific Rules

| Field Type | Assertion Pattern |
|-----------|------------------|
| **Required scalar (string)** | `isString` + `isNotEmpty` |
| **Required scalar (number)** | `isNumber` + `neq 0` |
| **Required scalar (boolean)** | `isBoolean` |
| **Required collection** | `isArray` + `isNotEmpty` |
| **Required nested object** | `isDefined` (parent) + leaf checks |
| **Required descriptor** | `isString` + `isNotEmpty` (on leaf) |
| **Optional/Conditional (ANY)** | ❌ **No assertion** |

### 9.4 Nested Object Assertions

For required nested objects (e.g., `calendarReference`):

```javascript
res.body[0].calendarReference: isDefined
res.body[0].calendarReference.schoolId: isNumber
res.body[0].calendarReference.schoolId: neq 0
res.body[0].calendarReference.schoolYear: isNumber
res.body[0].calendarReference.schoolYear: neq 0
res.body[0].calendarReference.calendarCode: isString
res.body[0].calendarReference.calendarCode: isNotEmpty
```

### 9.5 Collection Element Assertions

For required collections with required child fields:

```javascript
res.body[0].calendarEvents: isArray
res.body[0].calendarEvents: isNotEmpty
res.body[0].calendarEvents[0].calendarEventDescriptor: isString
res.body[0].calendarEvents[0].calendarEventDescriptor: isNotEmpty
```

### 9.6 Update/Delete Assertions (Single Resource)

Update scenarios reference `res.body` directly (object, not array):

```javascript
assert {
  res.status: eq 200
  res.body: isDefined
  res.body.id: isString
  res.body.id: isNotEmpty
  <required mutable field checks>
}
```

Delete scenarios expect absence:

```javascript
assert {
  res.status: eq 404
}
```

### 9.7 Prohibited Patterns

❌ **No inline comments inside assert blocks:**

```javascript
// WRONG:
assert {
  res.status: eq 200  // check success
  res.body: isArray   // should be array
}
```

✅ **Clean, machine-parseable only:**

```javascript
assert {
  res.status: eq 200
  res.body: isArray
}
```

---

## 10. Script Blocks

### 10.1 Baseline: `script:post-response`

**Purpose:** Cache entity ID, natural ID (if present), and all mutable field baseline values (including OPTIONAL/CONDITIONAL fields if present and will be mutated in subsequent scenarios).

**Standard Pattern:**

```javascript
script:post-response {
  const { pickSingle, setVars, wipeVars, extractDescriptor, mapDescriptors, joinDescriptors } = require('./utils');
  const { logScenario, logSpec<Entity> } = require('./logging');
  const entityName = '<EntityName>';
  const scenarioName = this.req.name;
  const single = pickSingle(res.getBody());
  
  if (!single) {
    wipeVars(bru, [
      '<ordinal><EntityName>UniqueId',
      '<ordinal><EntityName>Id',
      '<ordinal><EntityName><MutableField>',
      // ... all variables for this baseline (including optional/conditional if present and will be mutated)
    ], entityName, true);
  }
  
  setVars(bru, {
    <ordinal><EntityName>UniqueId: single.id,
    <ordinal><EntityName>Id: single.<naturalIdField>, // if naturalIdField exists
    <ordinal><EntityName><MutableField>: single.<mutableField>,  // any type: string, number, boolean, date, etc.
    <ordinal><EntityName><DescriptorField>: extractDescriptor(single.<descriptorField>),
    // For optional/conditional descriptor collections that will be mutated:
    <ordinal><EntityName><ConditionalDescriptorList>: joinDescriptors(
      mapDescriptors(single.<conditionalCollection> || [], item => item.<descriptorField>)
    ),
    // For optional/conditional non-descriptor fields that will be mutated:
    <ordinal><EntityName><OptionalField>: single.<optionalField>  // cache as-is (number, boolean, string, etc.)
  }, entityName);
  
  logScenario(entityName, scenarioName, single, logSpec<Entity>);
}
```

**Key Points:**

- `pickSingle()` validates exactly one record returned
- `wipeVars()` clears stale data on failure (third param `true` → throw error)
- Always cache `id` (mandatory)
- Cache `naturalIdField` only if present in config
- Use `extractDescriptor()` for descriptor fields (strips URI prefix)
- Use `mapDescriptors()` + `joinDescriptors()` for descriptor collections (REQUIRED, OPTIONAL, or CONDITIONAL)
- **Cache OPTIONAL/CONDITIONAL fields of ANY type if they will be mutated in a later update scenario for this ordinal**
- For non-descriptor OPTIONAL/CONDITIONAL fields: cache the raw value (numbers, booleans, strings, dates, etc.)
- Baseline logging MUST omit filtered field list (logs full spec)

### 10.2 Update: `script:pre-request`

**Purpose:** Validate prerequisite baseline variables exist before running update.

**Standard Pattern:**

```javascript
script:pre-request {
  const { validateDependency } = require('./utils');

  validateDependency(bru, '<ordinal><EntityName>UniqueId', 'NN - Check <ordinal> <EntityName> is valid', {
    actionHint: 'Ensure you ran the <ordinal> certification scenario successfully before continuing.'
  });
  validateDependency(bru, '<ordinal><EntityName><MutableField>', 'NN - Check <ordinal> <EntityName> is valid', {
    actionHint: 'Ensure you ran the <ordinal> certification scenario successfully before continuing.'
  });
}
```

**Action Hint Standard:**

- Exact sentence: `"Ensure you ran the <ordinal> certification scenario successfully before continuing."`
- `<ordinal>` = `first`, `second`, `third`, etc. (matching prerequisite baseline)
- Repeat same sentence for every dependency (intentional duplication for clarity)
- Do NOT embed scenario file name in actionHint (ordinal wording is stable)

### 10.3 Update: `script:post-response`

**Purpose:** Compare cached baseline values with current values to prove mutation.

**Standard Pattern:**

```javascript
script:post-response {
  const { getVar, expectChanged, extractDescriptor, mapDescriptors, joinDescriptors, throwNotFoundOrSpecificError } = require('./utils');
  const { logScenario, logSpec<Entity> } = require('./logging');
  const entityName = '<EntityName>';
  const scenarioName = this.req.name;
  
  if (res.status !== 200 || !res.body) {
    throwNotFoundOrSpecificError(entityName);
  }

  const current = res.getBody();
  
  // For scalar fields (REQUIRED, OPTIONAL, or CONDITIONAL) - any type:
  const previous<Field> = getVar(bru, '<ordinal><EntityName><Field>');
  expectChanged(previous<Field>, current.<field>, '<field>');
  
  // For descriptor fields (wrap both sides):
  const previousDescriptor = getVar(bru, '<ordinal><EntityName><DescriptorField>');
  expectChanged(previousDescriptor, extractDescriptor(current.<descriptorField>), '<descriptorField>');
  
  // For descriptor collections (REQUIRED, OPTIONAL, or CONDITIONAL):
  const previousList = getVar(bru, '<ordinal><EntityName><CollectionDescriptorList>');
  const currentList = joinDescriptors(
    mapDescriptors(current.<collection> || [], item => item.<descriptorField>)
  );
  expectChanged(previousList, currentList, '<collection> descriptors');
  
  logScenario(entityName, scenarioName, current, logSpec<Entity>, [
    'id',
    '<naturalIdField>', // if exists
    '<mutatedField1>',  // include REQUIRED, OPTIONAL, or CONDITIONAL if mutated (any type)
    '<mutatedField2>'
  ]);
}
```

**Key Points:**

- Use `expectChanged()` for mutation verification (works with any type: string, number, boolean, object, array, etc.)
- For descriptor mutations: wrap both sides with `extractDescriptor()`
- For descriptor collections (any requirement level): use `mapDescriptors()` + `joinDescriptors()` helpers
- Update logging MUST use filtered field list (Section 11.2)
- **Include OPTIONAL/CONDITIONAL fields in filtered log list if they were mutated (regardless of field type)**

**Examples:**

**Descriptor Collection (CONDITIONAL):**

```javascript
// Example: gradeLevels is CONDITIONAL descriptor collection
const previousList = getVar(bru, 'secondCalendarGradeLevelDescriptorList');
const currentList = joinDescriptors(
  mapDescriptors(current.gradeLevels || [], item => item.gradeLevelDescriptor)
);
expectChanged(previousList, currentList, 'gradeLevelDescriptor list');
```

**Numeric Field (OPTIONAL):**

```javascript
// Example: cumulativeEarnedCredits is OPTIONAL number
const previousCredits = getVar(bru, 'firstStudentAcademicRecordCumulativeEarnedCredits');
expectChanged(previousCredits, current.cumulativeEarnedCredits, 'cumulativeEarnedCredits');
```

**Boolean Field (CONDITIONAL):**

```javascript
// Example: cteCompleter is CONDITIONAL boolean
const previousCteCompleter = getVar(bru, 'firstDiplomaCteCompleter');
expectChanged(previousCteCompleter, current.diplomas[0].cteCompleter, 'cteCompleter');
```

**Filtered Log (multiple field types mutated):**

```javascript
logScenario(entityName, scenarioName, current, logSpecCalendar, [
  'calendarCode',           // natural ID (string)
  'calendarTypeDescriptor', // REQUIRED descriptor (mutated)
  'gradeLevels'             // CONDITIONAL descriptor collection (mutated)
]);
```

### 10.4 Delete: `script:pre-request`

Same as update pre-request (validate unique ID exists).

### 10.5 Delete: `script:post-response`

**Purpose:** Wipe all cached variables for the deleted baseline.

**Standard Pattern:**

```javascript
script:post-response {
  const { wipeVars } = require('./utils');
  const entityName = '<EntityName>';
  
  wipeVars(bru, [
    '<ordinal><EntityName>UniqueId',
    '<ordinal><EntityName>Id',
    '<ordinal><EntityName><Field1>',
    // ... all variables for this ordinal
  ], entityName, false); // false = don't throw on deletion
}
```

**No logging** for delete scenarios (no entity to log).

---

## 11. Logging Requirements

### 11.1 Logging Module Architecture

All entity-specific log specifications reside in `logging.js`:

```javascript
const { logScenario, logSpec<Entity> } = require('./logging');
```

Each entity has a dedicated `logSpec<Entity>` object defining field projections.

### 11.2 Baseline vs Update Logging

| Scenario Type | Field List Parameter | Rationale |
|--------------|---------------------|-----------|
| **Baseline (CREATE)** | ❌ Omit (full spec) | Provides complete context for initial record |
| **Update (PUT)** | ✅ Filtered list | Focus on mutated + identifying fields only |
| **Delete** | ❌ No logging | No entity present |

### 11.3 Update Scenario Filtered Field List

**Ordering (exclude implicit `id` and `lastModifiedDate` auto-added by utility):**

1. Natural ID (if exists)
2. Mutated scalar/descriptor fields
3. Relevant descriptor collections

**Example (CalendarDate update):**

```javascript
logScenario(entityName, scenarioName, current, logSpecCalendarDate, [
  'calendarCode',           // natural ID
  'calendarEvents'          // mutated descriptor collection
]);
```

**Example (CourseOffering title update):**

```javascript
logScenario(entityName, scenarioName, current, logSpecCourseOffering, [
  'localCourseCode',        // natural ID
  'localCourseTitle'        // mutated field
]);
```

### 11.4 Log Coverage Verification (REQUIRED & Mutated Fields)

**Mandatory Coverage Rules:**

1. All REQUIRED identifying fields (primary keys, natural ID) appear in at least one scenario log (prefer baseline)
2. **OPTIONAL/CONDITIONAL fields that are mutated** (values differ across scenario columns for the same ordinal) MUST be logged in that update scenario to provide evidence of change
3. REQUIRED collection fields logged via descriptor-level projection (not raw arrays)
4. **OPTIONAL/CONDITIONAL collection fields that are mutated** should be logged the same way (via descriptor projection) in the update scenario
5. Large collections omitted unless mutated or central to comprehension
6. Primary key constituents inside reference objects covered by natural ID surrogate

**Example (CONDITIONAL gradeLevels mutated):**

```javascript
// Scenario 2 baseline: Cache gradeLevels = ["Ninth grade"]
// Scenario 4 update: Verify gradeLevels changed to ["Ninth grade", "Tenth grade"]
logScenario(entityName, scenarioName, current, logSpecCalendar, [
  'calendarCode',           // natural ID
  'calendarTypeDescriptor', // mutated REQUIRED field
  'gradeLevels'             // mutated CONDITIONAL field - included for visibility
]);
```

**Escalation:** If a REQUIRED or mutated field cannot be mapped to a spec resolver, trigger Section 14 escalation.

### 11.6 Logging Specification Definition

**CRITICAL:** Each entity MUST have a corresponding `logSpec<Entity>` object defined in the collection's `logging.js` file.

**Structure:**

```javascript
// <EntityName> spec map (<EntityGroup> > <EntityFolder>)
// Include identifiers and mutated fields (<field1>, <field2>) plus selected required info.
const logSpec<EntityName> = {
  <naturalIdField>: r => r?.<naturalIdField>,
  <identifyingField>: r => r?.<field>,
  <mutableField>: r => r?.<mutableField>,
  <descriptorField>: r => extractDescriptor(r?.<descriptorField>),
  <nestedField>: r => r?.<parent>?.<child>,
  <collectionField>: r => r?.<collection>?.[0]?.<field>,
};
```

**Field Selection Rules:**

1. **Always include:**
   - Natural ID field (if exists)
   - All mutable fields (REQUIRED, OPTIONAL, or CONDITIONAL)
   - 3-5 key identifying fields for context

2. **Field type patterns:**
   - Scalar: `r => r?.fieldName`
   - Descriptor: `r => extractDescriptor(r?.descriptorField)`
   - Nested: `r => r?.parent?.child`
   - Collection element: `r => r?.collection?.[0]?.field`
   - Descriptor collection: `r => mapDescriptors(r?.collection, item => item.descriptor)`

3. **Export:** Add to module.exports in logging.js:

   ```javascript
   module.exports = {
     logScenario,
     // ... other specs
     ,logSpec<EntityName>
   };
   ```

### 11.7 Logging Conventions for Natural IDs

**Prefer logging scalar natural ID over full reference object:**

❌ **Avoid:**

```javascript
['id', 'calendarReference', 'calendarEvents']
```

✅ **Prefer:**

```javascript
['id', 'calendarCode', 'calendarEvents']
```

**Rationale:** Natural ID provides immediate recognizability with minimal noise. Full reference objects add verbosity without value unless a nested piece is under test.

---

## 12. Error Handling

### 12.1 Baseline Failure (No Single Record)

If `pickSingle()` returns `null` (0 or >1 records):

1. Wipe all cached variables for that baseline
2. Log warning message
3. Throw descriptive error

**Implemented via:**

```javascript
if (!single) {
  wipeVars(bru, [...allVariables], entityName, true); // true = throw
}
```

### 12.2 Update Failure (404 or Missing Body)

```javascript
if (res.status !== 200 || !res.body) {
  throwNotFoundOrSpecificError(entityName);
}
```

### 12.3 Missing Prerequisite Variables

Pre-request `validateDependency()` throws immediately if variable missing:

```javascript
validateDependency(bru, 'variableName', 'prerequisite scenario name', {
  actionHint: 'Ensure you ran the <ordinal> certification scenario successfully before continuing.'
});
```

### 12.4 Delete Verification (Expected 404)

Delete scenarios expect `res.status: eq 404`. If implementation returns `200` with empty body, escalate (Section 14).

---

## 13. Formatting Standards

### 13.1 Meta Block

**Required fields (all scenarios):**

```javascript
meta {
  name: <Scenario File Name>
  type: http
  seq: <NN>
}
```

`type: http` is **mandatory** for every scenario.

### 13.2 GET Block

**Three required lines after `url`:**

```javascript
get {
  url: <URL>
  body: none
  auth: inherit
}
```

- `body: none` → no request body for GET
- `auth: inherit` → use collection-level auth

### 13.3 Assert Block (Colon Syntax)

**All assertions use JSON-like colon syntax:**

✅ **Correct:**

```javascript
assert {
  res.status: eq 200
  res.body: isArray
  res.body: isNotEmpty
  res.body[0].id: isString
}
```

❌ **Incorrect (legacy space-separated):**

```javascript
assert {
  res.status eq 200
}
```

### 13.4 Settings Block

**Baseline scenarios with descriptor encoding:**

```javascript
settings {
  encodeUrl: false
  timeout: 0
}
```

**Update/delete scenarios (default):**

```javascript
settings {
  encodeUrl: true
}
```

---

## 14. Ambiguity Escalation

### 14.1 When to Escalate

If the generator encounters an ambiguity that cannot be resolved via:

1. Direct inference rules in this spec
2. Data in `folder.bru` required sections
3. Values in `entity.config.json`

→ **HALT** and request explicit user clarification.

### 14.2 Examples of Ambiguities

- Multiple `__UPDATE__` lines reference same ordinal with disjoint fields (unclear if combined or separate)
- Ordinal word (e.g., "third") appears but insufficient baselines defined
- Underscored token not in example table or API response sample
- Primary key field in config missing from example table
- Descriptor mutation implied but field path not locatable in JSON

### 14.3 Mandatory Pre-Escalation Attempts

Before escalating, attempt:

1. Case-insensitive normalization
2. Singular/plural heuristics (add/remove trailing 's')
3. camelCase ↔ PascalCase ↔ snake_case conversion
4. Cross-reference with `primaryKeyFields` (avoid misclassifying keys as mutable)

If still unresolved → escalate.

### 14.4 Escalation Output Format

```text
AMBIGUITY DETECTED:
Type: <field|ordinal|endpoint|update-collision|other>
Context: <short description>
Observed Source Text: "<raw line or token>"
Inference Attempts: [list of strategies tried]
Blocking Decision Needed: <explicit question>
Proposed Options:
  A) <option 1>
  B) <option 2>
Please reply with chosen option (A/B/...) or provide corrected definition.
```

### 14.5 Partial Progress

If ambiguity affects subset of scenarios, generator may:

- Generate unambiguous scenarios
- Mark pending ones with filenames ending `(pending-clarification).bru`
- Include comment-only docs block describing open question

---

## 15. Generation Checklist

Use this checklist to verify generated scenarios meet all requirements:

### 15.1 Configuration & Documentation

- [ ] `entity.config.json` exists with valid schema reference
- [ ] `primaryKeyFields` array is present and ordered correctly
- [ ] `naturalIdField` present (or explicitly null) if entity has human-readable ID
- [ ] `folder.bru` contains all three required doc sections:
  - [ ] `## Scenarios tasks`
  - [ ] `## Scenarios example data`
  - [ ] `## API response format`

### 15.2 Scenario Files

- [ ] All baselines numbered sequentially before updates
- [ ] All updates numbered sequentially before deletes
- [ ] File names match patterns exactly:
  - [ ] Baselines: `NN - Check <ordinal> <EntityName> is valid.bru`
  - [ ] Updates: `NN - Check <ordinal> <EntityName> <PropertyList> was Updated.bru`
  - [ ] Deletes: `NN - Check <ordinal> <EntityName> was Deleted.bru`
- [ ] Each scenario has `meta` block with `name`, `type: http`, and `seq`

### 15.3 Query Construction

- [ ] Baseline URLs use collection endpoint with primary key query params
- [ ] Update/delete URLs use single-resource endpoint with `{{<ordinal><EntityName>UniqueId}}`
- [ ] Descriptor parameters with `#` fragments use sentinel encoding pattern
- [ ] `params:query` block includes user-editable placeholders

### 15.4 Assertions

- [ ] All REQUIRED fields have presence + type assertions
- [ ] **No assertions for OPTIONAL or CONDITIONAL fields** (even if present or mutated)
- [ ] Nested required objects have `isDefined` parent + leaf checks
- [ ] Required collections have `isArray` + `isNotEmpty`
- [ ] **OPTIONAL/CONDITIONAL collections never asserted** (even if mutated)
- [ ] All assertions use colon syntax (no space-separated)
- [ ] No inline comments inside `assert {}` blocks

### 15.5 Variable Naming

- [ ] Unique ID variable: `<ordinal><EntityName>UniqueId`
- [ ] Natural ID variable: `<ordinal><EntityName>Id` (if `naturalIdField` exists)
- [ ] Mutable field variables: `<ordinal><EntityName><FieldName>`
- [ ] Descriptor variables: `<ordinal><EntityName><DescriptorField>`
- [ ] Encoded descriptor params: `<ordinal><DescriptorParam>Encoded`
- [ ] All variables use proper PascalCase capitalization

### 15.6 Script Blocks

- [ ] Baseline `script:post-response`:
  - [ ] Uses `pickSingle()` to validate single record
  - [ ] Calls `wipeVars()` if no record found (with `true` to throw)
  - [ ] Caches all required variables: `id`, natural ID (if any), all mutable fields
  - [ ] **Caches OPTIONAL/CONDITIONAL fields if they will be mutated in later update**
  - [ ] Uses `extractDescriptor()` for descriptor fields
  - [ ] Uses `mapDescriptors()` + `joinDescriptors()` for OPTIONAL/CONDITIONAL descriptor collections that will be mutated
  - [ ] Calls `logScenario()` without filtered field list (full spec)
- [ ] Update `script:pre-request`:
  - [ ] Validates all prerequisite variables with `validateDependency()`
  - [ ] **Validates OPTIONAL/CONDITIONAL cached variables if they're being compared**
  - [ ] Uses standard actionHint: `"Ensure you ran the <ordinal> certification scenario successfully before continuing."`
- [ ] Update `script:post-response`:
  - [ ] Checks `res.status` and `res.body` existence
  - [ ] Calls `throwNotFoundOrSpecificError()` on failure
  - [ ] Uses `expectChanged()` for each mutated field comparison (including OPTIONAL/CONDITIONAL)
  - [ ] Wraps descriptor comparisons with `extractDescriptor()`
  - [ ] Uses `mapDescriptors()` + `joinDescriptors()` for descriptor collection comparisons
  - [ ] Calls `logScenario()` with filtered field list (natural ID + mutated fields including OPTIONAL/CONDITIONAL)
- [ ] Delete `script:post-response`:
  - [ ] Wipes all cached variables with `wipeVars()` (false = don't throw)
  - [ ] No logging invocation

### 15.7 Logging

- [ ] Baseline scenarios log full spec (no field list parameter)
- [ ] Update scenarios log filtered fields: natural ID + mutated fields (including OPTIONAL/CONDITIONAL if mutated)
- [ ] Delete scenarios have no logging
- [ ] Log field lists follow ordering: id → natural ID → mutated → descriptor lists
- [ ] Imports from `logging.js`: `const { logScenario, logSpec<Entity> } = require('./logging');`

### 15.8 Formatting

- [ ] `meta` block has `type: http`
- [ ] `get` block has `body: none` and `auth: inherit`
- [ ] All assertions use colon syntax
- [ ] Settings block present:
  - [ ] Descriptor-encoded baselines: `encodeUrl: false`
  - [ ] Updates/deletes: `encodeUrl: true` (or omitted)

### 15.9 Descriptor Encoding (if applicable)

- [ ] Sentinel parameters use `_KEEP_IT_AT_THE_END` suffix
- [ ] Pre-request script calls `encodeDescriptorParameter()` correctly
- [ ] Encoded variable stored with correct ordinal prefix
- [ ] Settings has `encodeUrl: false`
- [ ] Both actual and sentinel params appear in `params:query` block

### 15.10 Error Handling

- [ ] Baseline failure triggers `wipeVars()` + throw
- [ ] Update failure triggers `throwNotFoundOrSpecificError()`
- [ ] Missing prerequisites caught by `validateDependency()`
- [ ] Delete scenarios expect `404` status

### 15.11 Quality Gates

- [ ] No cached variable without corresponding baseline
- [ ] No update referencing missing baseline ordinal
- [ ] All underscored tokens from tasks mapped to actual fields
- [ ] All primary key fields from config appear in example table
- [ ] No ambiguities remain unresolved (escalated if necessary)

### 15.12 Cross-References

- [ ] `utils.js` contains all required helper functions
- [ ] `logging.js` contains `logSpec<Entity>` definition for this entity
- [ ] `entity.config.json` schema path is correct: `"../../../schemas/entity-config.schema.json"`

---

## Appendix A: File Reference Cross-Index

| Component | File Location | Description |
|-----------|--------------|-------------|
| **Entity Config** | `./<Collection>/v4/<EntityGroup>/<EntityFolder>/entity.config.json` | Primary keys, natural ID, overrides |
| **Entity Docs** | `./<Collection>/v4/<EntityGroup>/<EntityFolder>/folder.bru` | Scenario tasks, example data, API response |
| **Scenario Files** | `./<Collection>/v4/<EntityGroup>/<EntityFolder>/NN - Check ....bru` | Generated test scenarios |
| **Config Schema** | `./schemas/entity-config.schema.json` | JSON schema for entity.config.json validation |
| **Utilities** | `./<Collection>/utils.js` | Shared helper functions (validation, caching, encoding) |
| **Logging** | `./<Collection>/logging.js` | Entity-specific log specifications |
| **Environments** | `./<Collection>/environments/*.bru` | Bruno environment configurations |

---

## Appendix B: Utility Function Reference

All functions available in `utils.js`:

| Function | Purpose | Usage |
|----------|---------|-------|
| `validateDependency()` | Pre-request variable validation | Throws if prerequisite variable missing |
| `pickSingle()` | Array → single object validator | Returns object if array length = 1, else null |
| `getVar()` / `setVar()` / `wipeVar()` | Individual variable management | Wrappers around Bruno runtime |
| `getVars()` / `setVars()` / `wipeVars()` | Batch variable management | Operate on multiple variables at once |
| `extractDescriptor()` | Descriptor URI → code value | Strips `uri://...#` prefix, returns code only |
| `mapDescriptors()` | Collection → descriptor array | Maps collection to descriptor values |
| `joinDescriptors()` | Descriptor array → string | Joins with `, ` separator |
| `encodeDescriptorUri()` | Fragment encoding (low-level) | Encodes `#` to `%23` + percent-encodes fragment |
| `encodeDescriptorParameter()` | Parameter extraction + encoding | High-level sentinel pattern helper |
| `expectChanged()` | Mutation verification | Bruno test assertion for value inequality |
| `expectUnchanged()` | Stability verification | Bruno test assertion for value equality |
| `throwNotFoundOrSpecificError()` | Standard error message | Throws consistent entity-not-found error |

---

## Appendix C: Example Entity Generation Walkthrough

**Entity:** CalendarDate  
**Location:** `./SIS/v4/EducationOrganizationCalendar/CalendarDates/`

### Step 1: Parse Config

```json
{
  "$schema": "../../../schemas/entity-config.schema.json",
  "version": 1,
  "identity": {
    "primaryKeyFields": ["schoolId", "schoolYear", "calendarCode", "date"],
    "naturalIdField": "calendarCode"
  }
}
```

**Derived:**

- Primary keys (query order): `schoolId`, `schoolYear`, `calendarCode`, `date`
- Natural ID variable: `<ordinal>CalendarDateId` → caches `calendarCode`

### Step 2: Parse Docs Tasks

```markdown
1. __CREATE__ the `first` Holiday `Calendar date` for the calendar at Grand Bend Elementary School
2. __CREATE__ the `second` Instructional day `Calendar date` for the calendar at Grand Bend High School
3. __UPDATE__ the _calendarEventDescriptor_ on the `first` added `Calendar date`
4. __UPDATE__ the _calendarEventDescriptor_ on the `second` added `Calendar date`
```

**Inferred Scenarios:**

- Baseline 1: `firstCalendarDate` (ordinal = first)
- Baseline 2: `secondCalendarDate` (ordinal = second)
- Update 1: Mutates `calendarEventDescriptor` on `firstCalendarDate`
- Update 2: Mutates `calendarEventDescriptor` on `secondCalendarDate`

### Step 3: Classify Fields from Example Table

| Field | Required | Behavior |
|-------|---------|----------|
| `date` | REQUIRED | Assert |
| `calendarReference` | REQUIRED | Assert parent + children |
| `calendarEvents` | REQUIRED | Assert array + element |
| `calendarEvents[].calendarEventDescriptor` | REQUIRED | Assert + cache for mutation |

### Step 4: Generate Files

```text
01 - Check first CalendarDate is valid.bru
02 - Check second CalendarDate is valid.bru
03 - Check first CalendarDate calendarEventDescriptor was Updated.bru
04 - Check second CalendarDate calendarEventDescriptor was Updated.bru
```

### Step 5: Baseline 1 Structure

**Meta:**

```javascript
meta {
  name: 01 - Check first CalendarDate is valid
  type: http
  seq: 1
}
```

**GET:**

```javascript
get {
  url: {{resourceBaseUrl}}/ed-fi/calendarDates?schoolId=[ENTER FIRST SCHOOL ID]&schoolYear=[ENTER FIRST SCHOOL YEAR]&calendarCode=[ENTER FIRST CALENDAR CODE]&date=[ENTER FIRST DATE YYYY-MM-DD]
  body: none
  auth: inherit
}
```

**Assertions:** (REQUIRED fields only)

```javascript
assert {
  res.status: eq 200
  res.body: isArray
  res.body: isNotEmpty
  res.body[0].id: isString
  res.body[0].id: isNotEmpty
  res.body[0].date: isString
  res.body[0].date: isNotEmpty
  res.body[0].calendarReference: isDefined
  res.body[0].calendarReference.schoolId: isNumber
  res.body[0].calendarReference.schoolId: neq 0
  res.body[0].calendarReference.schoolYear: isNumber
  res.body[0].calendarReference.schoolYear: neq 0
  res.body[0].calendarReference.calendarCode: isString
  res.body[0].calendarReference.calendarCode: isNotEmpty
  res.body[0].calendarEvents: isArray
  res.body[0].calendarEvents: isNotEmpty
  res.body[0].calendarEvents[0].calendarEventDescriptor: isString
  res.body[0].calendarEvents[0].calendarEventDescriptor: isNotEmpty
}
```

**Script (post-response):**

```javascript
script:post-response {
  const { pickSingle, setVars, wipeVars, mapDescriptors, joinDescriptors } = require('./utils');
  const { logScenario, logSpecCalendarDate } = require('./logging');
  const entityName = 'CalendarDate';
  const scenarioName = this.req.name;
  const single = pickSingle(res.getBody());
  
  if (!single) {
    wipeVars(bru, [
      'firstCalendarDateUniqueId',
      'firstCalendarDateId',
      'firstCalendarDateCalendarEventDescriptorList'
    ], entityName, true);
  }
  
  const descriptors = joinDescriptors(
    mapDescriptors(single.calendarEvents || [], ev => ev.calendarEventDescriptor)
  );
  
  setVars(bru, {
    firstCalendarDateUniqueId: single.id,
    firstCalendarDateId: single.calendarReference?.calendarCode,
    firstCalendarDateCalendarEventDescriptorList: descriptors
  }, entityName);
  
  logScenario(entityName, scenarioName, single, logSpecCalendarDate);
}
```

### Step 6: Update 1 Structure

**File:** `03 - Check first CalendarDate calendarEventDescriptor was Updated.bru`

**GET (single resource):**

```javascript
get {
  url: {{resourceBaseUrl}}/ed-fi/calendarDates/{{firstCalendarDateUniqueId}}
  body: none
  auth: inherit
}
```

**Pre-request:**

```javascript
script:pre-request {
  const { validateDependency } = require('./utils');

  validateDependency(bru, 'firstCalendarDateUniqueId', '01 - Check first CalendarDate is valid', {
    actionHint: 'Ensure you ran the first certification scenario successfully before continuing.'
  });
  validateDependency(bru, 'firstCalendarDateCalendarEventDescriptorList', '01 - Check first CalendarDate is valid', {
    actionHint: 'Ensure you ran the first certification scenario successfully before continuing.'
  });
}
```

**Post-response:**

```javascript
script:post-response {
  const { getVar, expectChanged, mapDescriptors, joinDescriptors, throwNotFoundOrSpecificError } = require('./utils');
  const { logScenario, logSpecCalendarDate } = require('./logging');
  const entityName = 'CalendarDate';
  const scenarioName = this.req.name;
  
  if (res.status !== 200 || !res.body) {
    throwNotFoundOrSpecificError(entityName);
  }

  const current = res.getBody();
  const previousList = getVar(bru, 'firstCalendarDateCalendarEventDescriptorList');
  const currentList = joinDescriptors(
    mapDescriptors(current.calendarEvents || [], ev => ev.calendarEventDescriptor)
  );
  
  expectChanged(previousList, currentList, 'calendarEventDescriptor list');
  
  logScenario(entityName, scenarioName, current, logSpecCalendarDate, [
    'calendarCode',
    'calendarEvents'
  ]);
}
```

---

## Appendix D: CONDITIONAL/OPTIONAL Field Handling Examples

**Important Note:** OPTIONAL and CONDITIONAL fields can be of **any data type**: strings, numbers, booleans, dates, objects, arrays, or descriptor collections. The examples below demonstrate handling different field types. The same principles apply regardless of type:

- Never assert OPTIONAL/CONDITIONAL fields
- Cache baseline value if field will be mutated
- Compare using `expectChanged()` in update scenarios
- Log in update scenarios when mutated

### Example 1: Descriptor Collection (CONDITIONAL)

**Entity:** Calendar  
**Location:** `./SIS/v4/EducationOrganizationCalendar/Calendars/`

### Scenario Overview from Docs

```markdown
1. __CREATE__ a `first` new `Calendar` for the elementary school with _calendarTypeDescriptor_ as "IEP".
2. __CREATE__ a `second` new `Calendar` for the high school with _calendarTypeDescriptor_ as "IEP" and _gradeLevelDescriptor_ as "Ninth grade".
3. __UPDATE__ the _calendarTypeDescriptor_ on the `first` added `Calendar` to be "Student Specific".
4. __UPDATE__ the _gradeLevelDescriptor_ on the `second` added `Calendar` to include "Tenth grade" also.
```

### Field Classification from Example Table

| Field | Required | Scenario 2 (POST) | Scenario 4 (PUT) | Mutation Detection |
|-------|----------|-------------------|------------------|-------------------|
| `calendarTypeDescriptor` | REQUIRED | IEP | IEP | No change (same ordinal = second) |
| `gradeLevels` | CONDITIONAL | (collection) | (collection) | Yes (Scenario 2 & 4 both reference "second" Calendar) |
| `gradeLevelDescriptor` | CONDITIONAL | Ninth grade | Ninth grade, Tenth grade | **Mutated** (list grew) |

**Key Insight:** Even though `gradeLevels` is CONDITIONAL, it mutates between Scenario 2 (baseline for second Calendar) and Scenario 4 (update for second Calendar).

### Baseline 2 Script (Scenario 2)

```javascript
script:post-response {
  const { pickSingle, setVars, wipeVars, extractDescriptor, mapDescriptors, joinDescriptors } = require('./utils');
  const { logScenario, logSpecCalendar } = require('./logging');
  const entityName = 'Calendar';
  const scenarioName = this.req.name;
  const single = pickSingle(res.getBody());
  
  if (!single) {
    wipeVars(bru, [
      'secondCalendarUniqueId',
      'secondCalendarId',
      'secondCalendarCalendarTypeDescriptor',
      'secondCalendarGradeLevelDescriptorList'  // Cache CONDITIONAL field (will be mutated)
    ], entityName, true);
  }
  
  // Cache CONDITIONAL collection because Scenario 4 will mutate it
  const gradeLevels = joinDescriptors(
    mapDescriptors(single.gradeLevels || [], item => item.gradeLevelDescriptor)
  );
  
  setVars(bru, {
    secondCalendarUniqueId: single.id,
    secondCalendarId: single.calendarCode,
    secondCalendarCalendarTypeDescriptor: extractDescriptor(single.calendarTypeDescriptor),
    secondCalendarGradeLevelDescriptorList: gradeLevels  // "Ninth grade"
  }, entityName);
  
  // Log full spec (no filtered list for baseline)
  logScenario(entityName, scenarioName, single, logSpecCalendar);
}
```

### Baseline 2 Assertions

**CRITICAL:** No assertions for `gradeLevels` even though it's present and will be mutated:

```javascript
assert {
  res.status: eq 200
  res.body: isArray
  res.body: isNotEmpty
  res.body[0].id: isString
  res.body[0].id: isNotEmpty
  res.body[0].calendarCode: isString
  res.body[0].calendarCode: isNotEmpty
  res.body[0].schoolReference: isDefined
  res.body[0].schoolReference.schoolId: isNumber
  res.body[0].schoolReference.schoolId: neq 0
  res.body[0].schoolYearTypeReference: isDefined
  res.body[0].schoolYearTypeReference.schoolYear: isNumber
  res.body[0].schoolYearTypeReference.schoolYear: neq 0
  res.body[0].calendarTypeDescriptor: isString
  res.body[0].calendarTypeDescriptor: isNotEmpty
  // ❌ NO assertion for gradeLevels (CONDITIONAL)
}
```

### Update 4 Script (Scenario 4)

```javascript
script:pre-request {
  const { validateDependency } = require('./utils');

  validateDependency(bru, 'secondCalendarUniqueId', '02 - Check second Calendar is valid', {
    actionHint: 'Ensure you ran the second certification scenario successfully before continuing.'
  });
  validateDependency(bru, 'secondCalendarGradeLevelDescriptorList', '02 - Check second Calendar is valid', {
    actionHint: 'Ensure you ran the second certification scenario successfully before continuing.'
  });
}

script:post-response {
  const { getVar, expectChanged, mapDescriptors, joinDescriptors, throwNotFoundOrSpecificError } = require('./utils');
  const { logScenario, logSpecCalendar } = require('./logging');
  const entityName = 'Calendar';
  const scenarioName = this.req.name;
  
  if (res.status !== 200 || !res.body) {
    throwNotFoundOrSpecificError(entityName);
  }

  const current = res.getBody();
  
  // Compare CONDITIONAL field mutation
  const previousList = getVar(bru, 'secondCalendarGradeLevelDescriptorList');
  const currentList = joinDescriptors(
    mapDescriptors(current.gradeLevels || [], item => item.gradeLevelDescriptor)
  );
  
  expectChanged(previousList, currentList, 'gradeLevelDescriptor list');
  
  // Log filtered list including the CONDITIONAL field that mutated
  logScenario(entityName, scenarioName, current, logSpecCalendar, [
    'calendarCode',        // natural ID
    'gradeLevels'          // CONDITIONAL but mutated - include for visibility
  ]);
}
```

### Update 4 Assertions

```javascript
assert {
  res.status: eq 200
  res.body: isDefined
  res.body.id: isString
  res.body.id: isNotEmpty
  // ❌ Still NO assertion for gradeLevels (remains CONDITIONAL)
}
```

### Key Takeaways (Example 1)

1. **Assertions:** Never assert CONDITIONAL descriptor collections, even when present and mutated
2. **Caching:** Use `mapDescriptors()` + `joinDescriptors()` for descriptor collections
3. **Comparison:** Use `expectChanged()` to prove list mutation
4. **Logging:** Include mutated CONDITIONAL field in update scenario filtered log

---

### Example 2: Numeric Field (OPTIONAL)

**Entity:** StudentAcademicRecord  
**Scenario:** Update OPTIONAL `cumulativeEarnedCredits` from 24 to 28

**Baseline Script:**

```javascript
script:post-response {
  // ... other caching ...
  
  setVars(bru, {
    firstStudentAcademicRecordUniqueId: single.id,
    firstStudentAcademicRecordCumulativeEarnedCredits: single.cumulativeEarnedCredits  // cache raw number (OPTIONAL)
  }, entityName);
}
```

**Baseline Assertions:**

```javascript
assert {
  res.status: eq 200
  res.body: isArray
  res.body: isNotEmpty
  res.body[0].id: isString
  res.body[0].id: isNotEmpty
  // ❌ NO assertion for cumulativeEarnedCredits (OPTIONAL)
}
```

**Update Script:**

```javascript
script:post-response {
  const current = res.getBody();
  const previousCredits = getVar(bru, 'firstStudentAcademicRecordCumulativeEarnedCredits');
  
  // Compare numeric values directly
  expectChanged(previousCredits, current.cumulativeEarnedCredits, 'cumulativeEarnedCredits');
  
  logScenario(entityName, scenarioName, current, logSpecStudentAcademicRecord, [
    'termDescriptor',                      // natural ID
    'cumulativeEarnedCredits'              // OPTIONAL but mutated
  ]);
}
```

### Key Takeaways (Example 2)

1. **Numeric fields:** Cache and compare raw numeric values (no special helpers needed)
2. **Type agnostic:** `expectChanged()` works with any JavaScript type
3. **No assertions:** Even though the field is present and has a value, never assert OPTIONAL fields

---

### Example 3: Boolean Field (CONDITIONAL)

**Entity:** Diploma (nested in StudentAcademicRecord)  
**Scenario:** Update CONDITIONAL `cteCompleter` from false to true

**Baseline Script:**

```javascript
script:post-response {
  // ... other caching ...
  
  setVars(bru, {
    firstDiplomaCteCompleter: single.diplomas?.[0]?.cteCompleter  // cache raw boolean (CONDITIONAL)
  }, entityName);
}
```

**Update Script:**

```javascript
script:post-response {
  const current = res.getBody();
  const previousCteCompleter = getVar(bru, 'firstDiplomaCteCompleter');
  
  // Compare boolean values directly
  expectChanged(previousCteCompleter, current.diplomas[0].cteCompleter, 'cteCompleter');
}
```

### Key Takeaways (Example 3)

1. **Boolean fields:** Cache and compare raw boolean values
2. **Nested paths:** Use optional chaining (`?.`) for safety when caching nested CONDITIONAL fields
3. **Array access:** If field is inside collection, use consistent index (typically `[0]`)

---

### Example 4: String Field (OPTIONAL)

**Entity:** Course  
**Scenario:** Update OPTIONAL `courseDescription` text

**Baseline Script:**

```javascript
script:post-response {
  setVars(bru, {
    firstCourseDescription: single.courseDescription  // cache raw string (OPTIONAL)
  }, entityName);
}
```

**Update Script:**

```javascript
script:post-response {
  const previousDescription = getVar(bru, 'firstCourseDescription');
  expectChanged(previousDescription, current.courseDescription, 'courseDescription');
}
```

### Key Takeaways (Example 4)

1. **String fields:** Cache and compare raw string values
2. **Same pattern:** Identical approach for any scalar type (string, number, boolean, date)

---

### Universal Key Takeaways (All OPTIONAL/CONDITIONAL Fields)

1. **Assertions:** Never assert CONDITIONAL/OPTIONAL fields, regardless of type (descriptor, number, boolean, string, date, object, array)
2. **Caching:** Cache baseline value if field will be mutated in a later update for the same ordinal

   - Descriptors: Use `extractDescriptor()` for single descriptors
   - Descriptor collections: Use `mapDescriptors()` + `joinDescriptors()`
   - All other types: Cache raw value directly

3. **Comparison:** Use `expectChanged()` in update script to prove mutation (works with any type)
4. **Logging:**

   - Baseline logs full spec (includes OPTIONAL/CONDITIONAL fields if present via logSpec projection)
   - Update logs filtered list that MUST include any mutated OPTIONAL/CONDITIONAL fields

5. **Detection:** Mutation is detected by comparing scenario columns for the same ordinal entity in example data table

---

## Appendix E: Common Pitfalls & Solutions

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Asserting optional fields** | Generate assertions for OPTIONAL/CONDITIONAL fields | Never assert optional fields; cache and compare in script if mutated, log if present |
| **Inline assert comments** | Comments inside `assert {}` break machine parsing | Remove all inline comments from assert blocks |
| **Wrong assertion syntax** | Using space-separated syntax: `res.status eq 200` | Always use colon syntax: `res.status: eq 200` |
| **Missing `type: http`** | Meta block lacks `type` field | Every scenario must have `type: http` in meta |
| **Missing `body: none`** | GET block lacks body declaration | Always include `body: none` for GET requests |
| **Update using collection query** | Update URLs use primary key query instead of ID | Always use single-resource form: `/entity/{{id}}` |
| **Forgetting natural ID** | Natural ID variable not cached when config defines it | Cache `<ordinal><Entity>Id` if `naturalIdField` exists |
| **Baseline filtered logging** | Baseline logs use filtered field list | Baseline MUST log full spec (omit field list param) |
| **Wrong actionHint format** | Custom actionHint text per dependency | Use standard: "Ensure you ran the <ordinal> certification scenario successfully before continuing." |
| **Descriptor encoding missing** | Fragment `#` not encoded in query params | Use sentinel pattern (Section 8) for all descriptor URIs |
| **Wrong variable capitalization** | Field `classPeriodName` cached as `classPeriodname` | Always PascalCase the field: `ClassPeriodName` |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-24 | Initial comprehensive specification |

---

**End of Specification**
