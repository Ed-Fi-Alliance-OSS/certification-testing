# Ed-Fi Certification Scenario Generation - Prompt Sequence

**Version:** 1.0  
**Date:** October 24, 2025  
**Purpose:** Sequential LLM prompts for generating Bruno scenarios from entity documentation

---

## Overview

This document provides a series of **generic, reusable prompts** that can be used with any Ed-Fi entity to generate complete Bruno test scenarios. Each prompt reads the entity's `folder.bru` documentation and `entity.config.json` configuration, then produces specific scenario files following the patterns defined in `spec.md`.

### How to Use

1. **Prepare your entity files:**
   - `folder.bru` with complete documentation (scenarios tasks, example data table, API response format)
   - `entity.config.json` with primary keys and natural ID configuration

2. **Run prompts sequentially:**
   - Each prompt builds on the previous one
   - Provide the same entity files to each prompt
   - Copy the output from each prompt to feed into the next

3. **Result:**
   - Complete set of baseline, update, and delete scenario `.bru` files
   - All files conform to specification requirements
   - Ready to use in Bruno for API testing

---

## Prompt Sequence

### Prompt 1: Parse Entity Configuration and Infer Metadata

```markdown
I need to generate Bruno API test scenarios for an Ed-Fi entity. I'll provide the #file:entity.config.json configuration file and #file:folder.bru documentation.

TASK:
Based on the specification in #file:spec.md, parse the configuration and infer entity metadata:

1. Extract from entity.config.json:
   - Primary key fields (in order)
   - Natural ID field (if present)
   - Irregular plural configuration (if present)

2. Infer from folder path or configuration:
   - Entity name (singular)
   - Entity folder name (plural)
   - API endpoint segment (camelCase)

3. Generate variable naming examples:
   - Unique ID variable pattern: <ordinal><EntityName>UniqueId
   - Natural ID variable pattern: <ordinal><EntityName>Id
   - Field variable pattern: <ordinal><EntityName><FieldName>

OUTPUT FORMAT:
Provide a structured summary:
- Entity Name: [singular]
- Entity Folder: [plural]
- Endpoint: [camelCase]
- Primary Keys: [ordered array]
- Natural ID Field: [field name or null]
- Sample Variables:
  - firstXxxUniqueId
  - firstXxxId
  - firstXxx[FieldName]

This will be the foundation for all scenario generation.
```

---

### Prompt 2: Parse Scenario Tasks and Identify Requirements

```markdown
Using the same entity files from Prompt 1, now parse the scenario tasks from the documentation.

ENTITY FILES:
[Same entity.config.json and folder.bru from Prompt 1]

TASK:
From the folder.bru "## Scenarios tasks" section, extract:

1. All CREATE tasks (baselines):
   - Extract ordinal: first, second, third, etc.
   - Note entity description

2. All UPDATE tasks:
   - Extract ordinal reference (which baseline)
   - Extract mutable fields (all _underscored_ tokens)
   - Note if multiple fields mutate in single update

3. All DELETE tasks:
   - Extract ordinal reference

4. Determine scenario sequence:
   - Number all baselines first (01, 02, 03...)
   - Number all updates next
   - Number all deletes last

5. Generate file names following spec patterns:
   - Baseline: "NN - Check <ordinal> <EntityName> is valid.bru"
   - Update: "NN - Check <ordinal> <EntityName> <PropertyList> was Updated.bru"
   - Delete: "NN - Check <ordinal> <EntityName> was Deleted.bru"

OUTPUT FORMAT:
Provide a scenario manifest:

BASELINES:
- 01 - Check first [Entity] is valid.bru
  - Ordinal: first
  - Cache variables: [list]

- 02 - Check second [Entity] is valid.bru
  - Ordinal: second
  - Cache variables: [list]

UPDATES:
- 03 - Check first [Entity] [field] was Updated.bru
  - Ordinal: first
  - Mutable fields: [list]
  - Dependencies: [variables needed from baseline]

DELETES:
- 05 - Check first [Entity] was Deleted.bru
  - Ordinal: first
  - Cleanup variables: [list]
```

---

### Prompt 3: Parse Example Data Table and Classify Fields

```markdown
Using the same entity files, now parse the example data table to classify fields.

ENTITY FILES:
[Same entity.config.json and folder.bru from Prompt 1]

SCENARIO MANIFEST:
[Paste output from Prompt 2]

TASK:
From the folder.bru "## Scenarios example data" table, extract field classifications:

1. For each field, identify:
   - Property name
   - Is it a collection? (TRUE/FALSE)
   - Data type
   - Requirement level: REQUIRED, OPTIONAL, or CONDITIONAL
   - Scenario values (to detect mutations)

2. Classify assertion behavior:
   - REQUIRED fields → must assert
   - OPTIONAL/CONDITIONAL fields → never assert

3. Detect field mutations:
   - Compare scenario column values for same ordinal
   - Mark fields that change between baseline and update

4. Handle nested fields:
   - Identify parent objects (e.g., calendarReference)
   - Identify collection elements (e.g., calendarEvents[].calendarEventDescriptor)

5. Cross-reference with mutable fields from scenario tasks

OUTPUT FORMAT:
Provide field classification table:

REQUIRED FIELDS (assert in baseline):
- id: string (scalar)
- date: string (scalar)
- calendarReference: object (parent object)
  - schoolId: number (nested)
  - schoolYear: number (nested)
  - calendarCode: string (nested)
- calendarEvents: array (collection)
  - calendarEventDescriptor: string (element, MUTABLE)

OPTIONAL/CONDITIONAL FIELDS (never assert, cache if mutated):
- gradeLevels: array (collection, CONDITIONAL, MUTABLE)
  - gradeLevelDescriptor: string (element)

MUTABLE FIELDS (cache in baseline, compare in update):
- calendarEventDescriptor (REQUIRED, in collection)
- gradeLevels (CONDITIONAL, collection)
```

---

### Prompt 4: Generate Baseline Scenario 1

```markdown
Generate the first baseline scenario file.

CONTEXT:
[Paste entity metadata from Prompt 1]
[Paste scenario manifest from Prompt 2]
[Paste field classifications from Prompt 3]

TASK:
Generate complete baseline scenario file for the FIRST ordinal following spec.md requirements:

1. META BLOCK:
   - name: [from scenario manifest]
   - type: http
   - seq: [sequence number]

2. GET BLOCK:
   - URL: collection endpoint with primary key query parameters
   - Use placeholders: [ENTER FIRST <FIELD NAME>]
   - body: none
   - auth: inherit

3. PARAMS:QUERY BLOCK:
   - List all primary key parameters
   - Use placeholders with type hints (dates: YYYY-MM-DD, etc.)

4. ASSERT BLOCK:
   - res.status: eq 200
   - res.body: isArray, isNotEmpty
   - res.body[0].id: isString, isNotEmpty
   - For each REQUIRED field:
     - Scalars: isString + isNotEmpty (or isNumber + neq 0, isBoolean)
     - Objects: isDefined parent + leaf checks
     - Collections: isArray + isNotEmpty + element[0] checks
   - NO assertions for OPTIONAL/CONDITIONAL fields

5. SCRIPT:POST-RESPONSE BLOCK:
   - Require utils and logging
   - Use pickSingle() to validate single record
   - wipeVars() on failure
   - setVars() to cache:
     - Unique ID (always)
     - Natural ID (if exists)
     - All mutable fields (including OPTIONAL/CONDITIONAL if they mutate later)
   - Use extractDescriptor() for descriptor fields
   - Use mapDescriptors() + joinDescriptors() for descriptor collections
   - logScenario() without filtered list (full spec)

6. SETTINGS BLOCK:
   - encodeUrl: true (or false if descriptor encoding needed)

OUTPUT:
Complete .bru file content ready to save.
```

---

### Prompt 5: Generate Remaining Baseline Scenarios

```markdown
Generate all remaining baseline scenario files.

CONTEXT:
[Paste entity metadata from Prompt 1]
[Paste scenario manifest from Prompt 2]
[Paste field classifications from Prompt 3]
[Paste Baseline 1 output from Prompt 4 as reference]

TASK:
Generate complete baseline scenario files for the SECOND, THIRD, etc. ordinals (if they exist).

Follow the exact same pattern as Prompt 4, but:
- Increment sequence numbers
- Use appropriate ordinal prefixes (second, third, etc.)
- Update variable names to match ordinal
- Update placeholders to match ordinal

OUTPUT:
Complete .bru file content for each remaining baseline scenario, separated clearly.
```

---

### Prompt 6: Generate First Update Scenario

```markdown
Generate the first update scenario file.

CONTEXT:
[Paste entity metadata from Prompt 1]
[Paste scenario manifest from Prompt 2]
[Paste field classifications from Prompt 3]

TASK:
Generate complete update scenario file for the FIRST update following spec.md requirements:

1. META BLOCK:
   - name: [from scenario manifest, includes mutable field names]
   - type: http
   - seq: [sequence number after all baselines]

2. GET BLOCK:
   - URL: single resource endpoint with unique ID variable
   - Format: {{resourceBaseUrl}}/ed-fi/<endpoint>/{{<ordinal><Entity>UniqueId}}
   - body: none
   - auth: inherit

3. ASSERT BLOCK (minimal for updates):
   - res.status: eq 200
   - res.body: isDefined
   - res.body.id: isString, isNotEmpty

4. SCRIPT:PRE-REQUEST BLOCK:
   - Require validateDependency
   - Validate each cached variable from prerequisite baseline:
     - Unique ID
     - All mutable field cached values
   - Use standard actionHint: "Ensure you ran the <ordinal> certification scenario successfully before continuing."
   - Reference prerequisite by file name: "[NN] - Check <ordinal> <Entity> is valid"

5. SCRIPT:POST-RESPONSE BLOCK:
   - Require utils and logging
   - Check res.status and res.body
   - throwNotFoundOrSpecificError() on failure
   - For each mutable field:
     - getVar() to retrieve cached baseline value
     - Compare with current value using expectChanged()
     - For descriptors: wrap both sides with extractDescriptor()
     - For descriptor collections: use mapDescriptors() + joinDescriptors()
     - For scalar OPTIONAL/CONDITIONAL: direct comparison
   - logScenario() with filtered list:
     - Natural ID (if exists)
     - All mutated fields (REQUIRED, OPTIONAL, or CONDITIONAL)

6. SETTINGS BLOCK:
   - encodeUrl: true

OUTPUT:
Complete .bru file content ready to save.
```

---

### Prompt 7: Generate Remaining Update Scenarios

```markdown
Generate all remaining update scenario files.

CONTEXT:
[Paste entity metadata from Prompt 1]
[Paste scenario manifest from Prompt 2]
[Paste field classifications from Prompt 3]
[Paste Update 1 output from Prompt 6 as reference]

TASK:
Generate complete update scenario files for all remaining updates (if they exist).

Follow the exact same pattern as Prompt 6, but:
- Use appropriate ordinal references
- Update variable names to match ordinal
- Validate correct prerequisite baseline
- Compare correct cached variables

OUTPUT:
Complete .bru file content for each remaining update scenario, separated clearly.
```

---

### Prompt 8: Generate Delete Scenarios (if present)

```markdown
Generate delete scenario files if DELETE tasks exist.

CONTEXT:
[Paste entity metadata from Prompt 1]
[Paste scenario manifest from Prompt 2]

TASK:
If DELETE tasks exist in the scenario manifest, generate complete delete scenario files following spec.md:

1. META BLOCK:
   - name: "NN - Check <ordinal> <EntityName> was Deleted"
   - type: http
   - seq: [sequence number after all updates]

2. GET BLOCK:
   - URL: single resource endpoint with unique ID variable
   - Format: {{resourceBaseUrl}}/ed-fi/<endpoint>/{{<ordinal><Entity>UniqueId}}
   - body: none
   - auth: inherit

3. ASSERT BLOCK:
   - res.status: eq 404

4. SCRIPT:PRE-REQUEST BLOCK:
   - Require validateDependency
   - Validate unique ID variable exists
   - Reference prerequisite baseline scenario

5. SCRIPT:POST-RESPONSE BLOCK:
   - Require wipeVars
   - wipeVars() to clean up all cached variables for this ordinal:
     - Unique ID
     - Natural ID (if exists)
     - All field variables
   - Last parameter: false (don't throw on deletion)
   - NO logging

6. SETTINGS BLOCK:
   - encodeUrl: true

OUTPUT:
Complete .bru file content for each delete scenario.

If no DELETE tasks exist, output: "No delete scenarios required for this entity."
```

---

### Prompt 9: Handle Descriptor Encoding (if needed)

```html
Check if descriptor parameter encoding is needed and adjust baseline scenarios.

CONTEXT:
[Paste entity metadata from Prompt 1]
[Paste field classifications from Prompt 3]
[Paste all generated baseline scenarios]

TASK:
Check if any primary key fields are descriptors (contain "#" fragment in values):

1. Review primary key fields from entity.config.json
2. Check field data types from example data table
3. If descriptor parameters exist:
   - Identify which baseline scenarios use them
   - Apply sentinel encoding pattern (spec.md Section 8)

4. For each affected baseline scenario, modify:
   
   GET BLOCK:
   - Add encoded variable: &<param>={{<ordinal><Param>Encoded}}
   - Add sentinel: &<param>_KEEP_IT_AT_THE_END=<defaultValue>
   
   PARAMS:QUERY BLOCK:
   - Add both parameters
   
   SCRIPT:PRE-REQUEST BLOCK (add before post-response):
   - Require encodeDescriptorParameter and setVar
   - Extract from sentinel and encode
   - Store in variable
   
   SETTINGS BLOCK:
   - Change encodeUrl to false
   - Add timeout: 0

OUTPUT:
If descriptor encoding needed:
- List affected scenarios
- Provide modified versions with encoding applied

If not needed:
- Output: "No descriptor parameter encoding required."
```

---

### Prompt 10: Generate Logging Specification

````markdown
Generate the logSpec definition for the entity in logging.js.

CONTEXT:
[Paste entity metadata from Prompt 1]
[Paste field classifications from Prompt 3]

TASK:
Create a logSpec object that will be added to the collection's logging.js file.

1. Analyze required fields for logging:
   - Natural ID field (if exists)
   - All mutable fields from update scenarios
   - Key identifying fields (firstName, lastName, etc.)
   - Selected required descriptors

2. Generate logSpec object following the pattern:

      ```javascript
      const logSpec<EntityName> = {
      <naturalIdField>: r => r?.<naturalIdField>,
      <identifyingField1>: r => r?.<field1>,
      <identifyingField2>: r => r?.<field2>,
      <mutableField1>: r => r?.<mutableField1>,
      <mutableField2>: r => r?.<mutableField2>,
      <descriptorField>: r => extractDescriptor(r?.<descriptorField>),
      <nestedField>: r => r?.<parent>?.<child>,
      <collectionField>: r => r?.<collection>?.[0]?.<field>,
      };
      ```

3. For each field type:

   - **Scalar fields**: Direct access with optional chaining: `r => r?.fieldName`
   - **Descriptor fields**: Wrap with extractDescriptor: `r => extractDescriptor(r?.descriptorField)`
   - **Nested objects**: Use optional chaining: `r => r?.parent?.child`
   - **Collection elements**: Access first element: `r => r?.collection?.[0]?.field`
   - **Descriptor collections**: Use mapDescriptors helper (see existing examples in logging.js)

4. Include only fields that should appear in logs:

   - Natural ID (mandatory if exists)
   - Mutable fields (both REQUIRED and OPTIONAL/CONDITIONAL if mutated)
   - 3-5 key identifying fields for context
   - Exclude verbose fields unless they mutate

OUTPUT:
Provide the complete logSpec definition ready to be added to logging.js:

```javascript
// <EntityName> spec map (<EntityGroup> > <EntityFolder>)
// Include identifiers and mutated fields (<field1>, <field2>) plus selected required personal info.
const logSpec<EntityName> = {
<naturalIdField>: r => r?.<naturalIdField>,
// ... all fields
};
```

Also provide the export statement addition for the module.exports at the end of logging.js:

```javascript
  ,logSpec<EntityName>
```

````

---

### Prompt 11: Validation and Summary

```markdown
Validate all generated scenarios against the specification checklist.

CONTEXT:
[Paste all generated scenario files from Prompts 4-9]
[Paste entity metadata from Prompt 1]
[Paste field classifications from Prompt 3]

TASK:
Validate against spec.md Section 15 checklist:

1. Configuration & Documentation:
   - ✓ entity.config.json exists with valid schema
   - ✓ primaryKeyFields present and ordered
   - ✓ naturalIdField present (or null)
   - ✓ folder.bru has all three required sections

2. Scenario Files:
   - ✓ All baselines numbered before updates
   - ✓ All updates numbered before deletes
   - ✓ File names match patterns exactly
   - ✓ Each has meta block with name, type:http, seq

3. Query Construction:
   - ✓ Baselines use collection endpoint
   - ✓ Updates/deletes use single resource endpoint
   - ✓ Descriptor encoding applied if needed
   - ✓ params:query blocks present

4. Assertions:
   - ✓ All REQUIRED fields asserted
   - ✓ NO OPTIONAL/CONDITIONAL fields asserted
   - ✓ Nested objects have parent + leaf checks
   - ✓ Collections have isArray + isNotEmpty
   - ✓ Colon syntax used

5. Variable Naming:
   - ✓ Unique ID variables correct
   - ✓ Natural ID variables correct (if exists)
   - ✓ Mutable field variables correct
   - ✓ PascalCase capitalization

6. Script Blocks:
   - ✓ Baselines cache all required variables
   - ✓ Baselines cache OPTIONAL/CONDITIONAL if mutated
   - ✓ Updates validate prerequisites
   - ✓ Updates compare mutations correctly
   - ✓ Deletes wipe variables
   - ✓ Logging correct (full spec baseline, filtered update)

7. Error Handling:
   - ✓ pickSingle() used
   - ✓ wipeVars() on failure
   - ✓ validateDependency() in updates
   - ✓ throwNotFoundOrSpecificError() in updates

OUTPUT:
Provide validation report:

VALIDATION SUMMARY:
✓ Configuration: [X/X checks passed]
✓ Scenario Files: [X/X checks passed]
✓ Query Construction: [X/X checks passed]
✓ Assertions: [X/X checks passed]
✓ Variable Naming: [X/X checks passed]
✓ Script Blocks: [X/X checks passed]
✓ Error Handling: [X/X checks passed]

ISSUES FOUND: [list any issues or "None"]

GENERATED FILES:
- 01 - Check first [Entity] is valid.bru
- 02 - Check second [Entity] is valid.bru
- 03 - Check first [Entity] [field] was Updated.bru
- ...

All scenarios ready for use in Bruno.
```

---

## Usage Example

### Step-by-Step Process

1. **Run Prompt 1:**
   - Paste both files into prompt
   - Get entity metadata output

2. **Run Prompt 2:**
   - Paste same files + metadata from Prompt 1
   - Get scenario manifest

3. **Run Prompt 3:**
   - Paste same files + outputs from 1 & 2
   - Get field classifications

4. **Run Prompts 4-5:**
   - Generate all baseline scenarios
   - Save each .bru file

5. **Run Prompts 6-7:**
   - Generate all update scenarios
   - Save each .bru file

6. **Run Prompt 8:**
   - Generate delete scenarios (if any)
   - Save each .bru file

7. **Run Prompt 9:**
   - Check descriptor encoding
   - Modify affected scenarios if needed

8. **Run Prompt 10:**
    - Validate all outputs
    - Review summary report
    - Confirm all files ready

### Expected Timeline

- **Simple entity** (2 baselines, 2 updates): ~15-20 minutes
- **Complex entity** (multiple baselines, updates, deletes): ~30-40 minutes
- **Entity with descriptor encoding**: Add 5-10 minutes

### Quality Assurance

Each prompt builds verification into the process:

- Prompt 1: Validates configuration parsing
- Prompt 2: Validates scenario detection
- Prompt 3: Validates field classification
- Prompts 4-8: Generate conformant code
- Prompt 9: Handles edge cases
- Prompt 10: Comprehensive validation

---

## Key Principles

### Generic and Reusable

- No hard-coded entity names
- Works with any Ed-Fi entity
- Adapts to entity-specific patterns

### Incremental Progress

- Each prompt builds on previous
- No orphaned outputs
- Clear dependencies

### Spec Conformance

- Every prompt references spec.md
- Validation against checklist
- No deviation from standards

### Complete Coverage

- Baselines, updates, deletes
- Required and optional fields
- Descriptor encoding
- Error handling

---

## Troubleshooting

### If Prompt Fails

- Review input files for completeness
- Check folder.bru has all three required sections
- Verify entity.config.json has primaryKeyFields
- Try prompt again with corrections

### If Validation Fails

- Review Prompt 10 output
- Identify specific failing checks
- Re-run relevant prompt with fixes
- Validate again

### If Ambiguity Detected

- LLM should escalate per spec.md Section 14
- Provide clarification
- Continue from that prompt

---

## End of Prompt Sequence
