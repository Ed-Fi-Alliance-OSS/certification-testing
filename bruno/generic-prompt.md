# GENERIC ED-FI READ-ONLY CERTIFICATION AUTHORING PROMPT (CONFIG + DOCS DRIVEN)

This prompt is consumed by an agent to auto-generate Bruno (.bru) read-only certification scenarios for any Ed-Fi entity using:
1. Entity documentation inside `docs {}` of `folder.bru` (public authoritative sections).
2. A minimal machine-readable `entity.config.json` (primary keys & optional natural key only; plus optional overrides).
3. Folder path conventions to infer entity identifiers.

## 1. FOLDER / PATH INFERENCE RULES
Given path: `./SIS/v4/<EntityGroup>/<EntityFolder>/folder.bru`
- baseFolderPath: `./SIS/v4`
- entityGroup: `<EntityGroup>` (parent of entity folder)
- entityFolder: `<EntityFolder>` (plural PascalCase, e.g. `ClassPeriods`)
- entityName (singular): remove trailing 's' (naive singularization) from entityFolder (e.g. `ClassPeriods` → `ClassPeriod`). If irregular, a future override may be added.
- endpoint segment (camelCase plural for human readability): lowercase FIRST letter of entityFolder and keep remaining characters intact (e.g. `ClassPeriods` → `classPeriods`, `CalendarDates` → `calendarDates`). If the underlying API demands fully lowercase canonical segments, an implementation MAY offer a toggle or per-entity override, but default generation uses camelCase.
 - endpoint segment (camelCase plural for human readability): lowercase FIRST letter of entityFolder and keep remaining characters intact (e.g. `ClassPeriods` → `classPeriods`, `CalendarDates` → `calendarDates`). If the underlying API demands fully lowercase canonical segments, an implementation MAY offer a toggle or per-entity override, but default generation uses camelCase. For irregular pluralization (e.g. Person → People, StaffLeave → StaffLeaves), provide overrides in `identity.irregularPlural` within `entity.config.json`.

## 2. CONFIG FILE (`entity.config.json`)
Schema: `schemas/entity-config.schema.json` (primaryKeyFields order is authoritative).
Minimal example:
```json
{
  "version": 1,
  "identity": { "primaryKeyFields": ["schoolId","classPeriodName"], "naturalIdField": "classPeriodName" }
}
```
Optional overrides accepted (see schema) but agent SHOULD rely on inference where possible.

### 2.1 Irregular Plural Override
If naive singularization (strip trailing 's') or camelCase pluralization would produce an incorrect form, specify:
```json
{
  "version": 1,
  "identity": {
    "primaryKeyFields": ["personId"],
    "naturalIdField": "personId",
    "irregularPlural": {
      "singular": "Person",
      "plural": "People",
      "endpointSegment": "people"  // optional; defaults to camelCase plural of plural form (people)
    }
  }
}
```
Rules when `irregularPlural` present:
- Use `singular` for variable stems (firstPersonUniqueId).
- Use `plural` folder name if generating or validating structure.
- Use `endpointSegment` if supplied; otherwise camelCase the plural (People → people).

## 3. DOCS EXTRACTION (from folder.bru docs {})
Required public sections always present:
- `## Scenarios tasks`  (drives baseline & update detection)
- `## Scenarios example data` (table; used to classify optional vs required fields & collections)
- `## API response format` (sample JSON; fallback for structure / nested objects)
Removed / migrated (NOT present in future docs):
- `## Primary Keys (for filtering)` (moved to config)
- `## Natural Key (optional - for caching)` (moved to config)

### 3.1 Scenario Inference from "Scenarios tasks"
Parsing rules per line (ordered):
- Baseline identifier lines contain `__CREATE__` → defines a baseline scenario.
- Update identifier lines contain `__UPDATE__` → defines an update scenario referencing a prior baseline.
- Ordinality: Look for tokens `first`, `second`, `third`, `fourth`, `fifth`, `sixth`, etc. Map to ordinal index (1..n). If absent, use sequential ordering encountered.
- Each baseline gets variable prefix: `first|second|third|...<EntityName>`.
- Each update ties to the ordinal described by the nearest preceding ordinal keyword within the same task line. If ambiguous, fallback to explicit numeric order (e.g., 1st update after baseline 1 if it references "first").

### 3.2 Mutable Field Detection
Within an `__UPDATE__` task line:
- Underscored segments (Markdown italic via single `_`) or bold+italic patterns representing field names mark mutable fields.
  - Strip surrounding underscores / asterisks → field path token (e.g. `_classPeriodName_` → `classPeriodName`).
- If token includes `descriptor` (case-insensitive) treat as a descriptor field → always normalize with `extractDescriptor()` and cache baseline + compare update (expectChanged if update implies mutation).
- If field is optional per the example data table and appears underscored in update task, treat the field as an optional conditional to assert (assert only if present) AND mutable if in update context.
 - Nested / collection fields: If the mutable token corresponds to a property that in the API response sample or example data table appears inside a collection (e.g. `meetingTimes.startTime`), infer the path by:
   1. Locating the collection name from the table (e.g. `meetingTimes`).
   2. Assuming index `0` (first element) for caching & comparison (i.e. `entity.meetingTimes[0].startTime`).
   3. Variable naming uses ONLY the leaf field (e.g. `secondClassPeriodStartTime`).
   4. Assertions still validate collection existence (`isArray` / `isNotEmpty`) before dereferencing `[0]`.
   5. If ambiguity exists (multiple potential collections contain the field), trigger ambiguity escalation (Section 14) instead of guessing.

### 3.3 Required / Optional / Conditional Field Classification
From `## Scenarios example data` table (column header may appear as `Required / Optional` or simply `Required`):
- Columns: Resource | Property Name | Is Collection | Data Type | Required(/ Optional) | Scenario n columns ...
- Interpret cell values (case-insensitive):
  - `REQUIRED` → always assert (scalar presence / non-empty OR array presence & non-empty; references & descriptors asserted for presence & type).
  - `OPTIONAL` → do not assert unless the field is explicitly mutated (underscored in an `__UPDATE__` task) or listed via future override → then treat as optional conditional (assert-if-present) and cache only if mutable.
  - `CONDITIONAL` → treat identically to `OPTIONAL` for generation (assert-if-present only). Rationale: Without embedded business rule logic, the generator cannot determine runtime satisfaction; escalation would add little value. If later a machine-readable rule set is added, this behavior can be refined.
- Collections (Is Collection = TRUE / indicator):
  - REQUIRED collections: assert array presence & isNotEmpty.
  - OPTIONAL / CONDITIONAL collections: assert nothing unless mutated (then apply assert-if-present pattern; still avoid asserting length > 0 unless mutation implies element-level change being compared).
- Mutated OPTIONAL / CONDITIONAL scalar/descriptor fields: add to optionalConditionals + mutable cache list.
- Do NOT treat primary key fields as mutable even if marked OPTIONAL/CONDITIONAL (if that occurs, escalate; keys should be REQUIRED).

### 3.4 Primary Key Query Construction
Use `identity.primaryKeyFields` ordered list. For each baseline scenario build collection GET:
`GET {{resourceBaseUrl}}/ed-fi/<endpoint>?pk1=...&pk2=...` using values from scenario query tokens. Where values not specified in tasks line, leave placeholder `[ENTER <UPPER_SNAKE_CASE_FIELD>]` for manual fill.
Natural key caching (if `naturalIdField` defined) → `<ordinal><EntityName>Id`.
Mandatory unique id caching (entity.id) → `<ordinal><EntityName>UniqueId`.

## 4. VARIABLE NAMING RULES
- UniqueId: firstClassPeriodUniqueId
- Natural Id: firstClassPeriodId (only if naturalIdField exists)
- Mutable cached field: firstClassPeriodClassPeriodName (property capitalized & appended)
- Descriptor field: firstClassPeriodTermDescriptor (example pattern).
Capitalization: Take field segment, uppercase first letter (camel to Pascal) and append to prefix.

## 5. SCENARIO FILE NAMING
Order all baselines first, then all updates (normalized pattern):
1. Baselines ascending ordinal.
2. Updates ascending by referenced baseline ordinal (retain numeric continuity).

### 5.1 Baseline File Name Pattern
`NN - Check <ordinal> <EntityName> is valid.bru`

### 5.2 Update File Name Pattern (Property-Aware)
`NN - Check <ordinal> <EntityName> <PropertyList> was Updated.bru`

Where:
- `<PropertyList>` is a deterministic, ordered list of mutated property tokens inferred from the `__UPDATE__` task line (Section 3.2) AFTER normalization.
- Use the LEAF token only (e.g. `meetingTimes.startTime` → `startTime`). If the mutation refers to an entire collection (e.g. `_meetingTimes_`), use `meetingTimes`.
- Descriptor tokens retain full token (e.g. `courseLevelCharacteristicDescriptor`).
- Multiple mutated properties in a single update line: preserve original discovery order and join:
  * 2 properties: `<PropA> and <PropB>`
  * 3+ properties: `<PropA>, <PropB>, <PropC>` (Oxford comma optional) – no trailing 'and' to keep names concise.
- Always use `was Updated` (even if property plural) for uniformity and simpler parsing.

Grammar / Casing Rules:
- Do NOT attempt to humanize (no spaces inserted inside camelCase tokens).
- Keep exact casing from docs token normalization (camelCase assumed).

Examples for two baselines with two single-property updates:
01 - Check first ClassPeriod is valid.bru
02 - Check second ClassPeriod is valid.bru
03 - Check first ClassPeriod classPeriodName was Updated.bru
04 - Check second ClassPeriod meetingTimes was Updated.bru

Example with multi-field update on second entity (updating both `startTime` and `endTime`):
04 - Check second ClassPeriod startTime and endTime was Updated.bru

If an ambiguity about which properties are mutated exists (e.g. unclear tokens), follow Section 14 escalation instead of guessing the filename.

## 6. ASSERTION STRATEGY
Baseline assert block (collection): structural presence only:
- res.status eq 200
- res.body isArray & isNotEmpty
- id string & not empty
- Required scalars: isString/isNumber/isBoolean + notEmpty / neq 0
- Required collections: isArray + isNotEmpty
- Required nested descriptors / references: isDefined(leaf) & leaf type checks.
- No variable declarations inside assert.

Update assert block (single resource): similar structural checks for fields under test plus presence of id.

## 7. SCRIPT BLOCKS
### 7.1 Baseline (script:post-response)
Pseudo:
```
const { pickSingle, setVars, wipeVars, extractDescriptor } = require('./utils');
const { logScenario, logSpec<Entity> } = require('./logging');
const entityName = '<EntityName>';
const scenario = this.req.name;
const entity = pickSingle(res.getBody());
if (!entity) {
  wipeVars(bru, ['first<EntityName>UniqueId', /* mutable caches */], entityName, true);
}
setVars(bru, {
  first<EntityName>UniqueId: entity.id,
  first<EntityName>Id: entity.<naturalIdField>, // only if present
  first<EntityName><MutableField>: entity.<mutableField>,
  first<EntityName><DescriptorField>: extractDescriptor(entity.<descriptorField>)
});
logScenario(...)
```
### 7.2 Update (script:pre-request)
Validate prerequisite caches with `validateDependency` for the uniqueId plus each mutable / descriptor cached field.

ACTION HINT STANDARD (MANDATORY)
```
validateDependency(bru, 'first<EntityName>UniqueId', '01 - Check first <EntityName> is valid', {
  actionHint: 'Ensure you ran the first certification scenario successfully before continuing.'
});
validateDependency(bru, 'first<EntityName><MutableField>', '01 - Check first <EntityName> is valid', {
  actionHint: 'Ensure you ran the first certification scenario successfully before continuing.'
});
```
Pattern:
* Exact sentence (case-sensitive apart from ordinal): `Ensure you ran the <ordinal> certification scenario successfully before continuing.`
* `<ordinal>` = first | second | third | fourth | etc., matching the prerequisite baseline whose variables must already be cached.
* Repeat the same sentence for every dependency in the update scenario (duplication is intentional for clarity / consistency).
* Do NOT embed the scenario file name or meta.name inside the `actionHint`; the ordinal wording is stable even if filenames change.
* If an update depends on multiple baselines (rare), use separate `validateDependency` calls each with its own correct ordinal phrase.
Rationale: This wording is concise, uniform, and resilient to scenario renames.
### 7.3 Update (script:post-response)
```
const { getVar, expectChanged, extractDescriptor, logScenario, throwNotFoundOrSpecificError } = require('./utils');
const current = res.getBody();
expectChanged(getVar(bru, 'first<EntityName><Field>'), current.<field>, '<field>');
```
For descriptor mutation: wrap both sides with extractDescriptor.

### 7.4 Logging Conventions (naturalId & field selection)
The logging step (`logScenario`) exists to aid human review and diff triage. To keep logs concise and human-friendly:

Implementation Note: All per-entity logging specification maps (logSpec<Entity>) now reside in a dedicated `logging.js` module (e.g. `const { logScenario, logSpecSchool } = require('./logging');`). Scenarios MUST import the specific spec(s) they use directly from that module instead of relying on a re-export from `utils.js`. This keeps `utils.js` lightweight and makes adding new entity specs a single‑file change.

1. Always include `id` (the GUID/system id) AND the natural identifier (if `naturalIdField` is defined in `entity.config.json`) in the `logScenario` field list for both baseline and update scenarios.
  - Baseline example field list: `['id','calendarCode','calendarTypeDescriptor','gradeLevels']`
  - Update example field list (single-field change): `['calendarCode','calendarTypeDescriptor']` (include `id` if helpful for correlation; optional when natural id already present, but recommended for uniformity).
2. Prefer logging the scalar natural id over an entire reference object. For example, log `calendarCode` instead of the whole `calendarReference` structure unless a nested piece inside that reference is itself under test.
3. Do NOT log full large collections or deeply nested objects unless they contain a mutated field you are explicitly verifying. Instead, log only the collection of descriptors or the specific element(s) you compare.
4. When comparing descriptor lists, you may still log the list (e.g. `gradeLevels`, `calendarEvents`) but avoid additionally logging their parent wrapper if redundant.
5. If no `naturalIdField` exists (null/omitted), omit step 1 for natural id; only `id` is required.
6. Legacy scenarios that previously logged full reference objects SHOULD be migrated to the natural id + targeted fields pattern. If backward compatibility is temporarily required, add a comment noting the pending migration.
7. For consistency across entities, recommended update scenario logging order:
  1. `id`
  2. natural id (if present)
  3. mutated descriptor/scalar fields
  4. any descriptor lists involved in comparisons
8. Avoid including unchanged, un-mutated fields simply for verbosity; every logged field should either (a) identify the record (id/natural id) or (b) have been part of the comparison/verification.

Example (CalendarDate baseline):
```js
logScenario(entityName, scenarioName, single, logSpecCalendarDate, ['id','calendarCode','calendarEvents']);
```
Example (CalendarDate update of calendarEventDescriptor list):
```js
logScenario(entityName, scenarioName, current, logSpecCalendarDate, ['id','calendarCode','calendarEvents']);
```
Example (CourseOffering title update):
```js
logScenario('CourseOffering', scenarioName, current, logSpecCourseOffering, ['id','localCourseCode','localCourseTitle']);
```

Rationale: Logging the natural id instead of the entire reference provides immediate recognizability while reducing noise. Consistent ordering simplifies visual scanning and diff tooling.

### 7.5 Log Coverage Verification (REQUIRED & CONDITIONAL fields)
To ensure logs remain both concise and semantically complete, the agent MUST verify that for every entity:

1. All REQUIRED scalar identifying fields (primaryKeyFields, naturalIdField if present, plus any REQUIRED non-key simple fields explicitly mutated or referenced in update tasks) appear in at least one scenario log field list (baseline preferred). If absent, add them to the baseline log field list unless doing so would introduce noisy, high‑volume data (see point 4 for collections).
2. CONDITIONAL fields that become part of a mutation (underscored in an `__UPDATE__` task) MUST be logged in that update scenario’s log field list (even if optional/conditional) to provide evidence of change.
3. REQUIRED collection fields SHOULD be logged only via their distilled, descriptor‑level projection already defined in the corresponding `logSpec<entity>` (e.g., `gradeLevels`, `calendarEvents`, `courseLevelCharacteristics`). If such a projection does not exist and the collection is mutated or central to comprehension (e.g., list length change), add a minimal resolver (e.g., mapping to descriptor strings) before logging.
4. Avoid logging raw large collections (object-heavy arrays) directly; always prefer a normalized extraction already provided by spec (descriptor list, names, codes). If no normalization rule exists and the collection is required but not mutated, it may be omitted from logs to reduce noise.
5. When a REQUIRED field is intentionally excluded from logs (e.g., redundancy with a natural id or excessive length), the agent MUST add an inline code comment in the scenario file citing: `// omitted from log: <field> (reason)`.
6. Primary key constituent fields that are not themselves separate scalar properties in the response (because they appear only inside a reference object) are considered covered if their scalar equivalent (e.g. `schoolId`) or the natural id surrogate is logged.
7. Verification Order (per scenario generation pass):
  a. Derive REQUIRED & CONDITIONAL mutated field set.
  b. Compare against existing chosen log field list.
  c. Append missing mandatory log fields in the prescribed ordering (id → natural id → mutated fields → descriptor lists).
8. The generator SHOULD NOT retroactively modify user‑authored custom field lists unless they violate points 1 or 2; additive only.

Escalation: If a REQUIRED field cannot be confidently mapped to a spec resolver (missing in sample JSON & table), trigger Section 14 ambiguity escalation rather than silently skipping.

Outcome: Guarantees every required identifying/changed element is visible in at least one log output, while preserving the minimal noise principle from Section 7.4.

## 8. MUTABLE FIELD & OPTIONAL / CONDITIONAL CONDITIONAL INFERENCE SUMMARY
- Mutable fields = all underscored property tokens from `__UPDATE__` tasks.
- Optional conditional assertions = subset of mutable fields that are OPTIONAL or CONDITIONAL in example table.
- Cache only mutable fields + descriptors + id(s).

## 9. ERROR HANDLING
If baseline pickSingle returns null/undefined: wipe all cached variables for that baseline and throw (prevent stale updates).
If update GET fails 404: invoke throwNotFoundOrSpecificError.

## 10. LEGACY EXCLUSION
Ignore any legacy 'temp' naming. Always generate fresh ordinal names. No migration mapping required.

## 11. AGENT OUTPUT EXPECTATION
For each entity folder with `folder.bru` + `entity.config.json`, produce scenario files matching inferred baselines and updates.
Zero additional user parameters required beyond manual substitution of placeholder PK values not inferable from tasks text.

## 12. EXTENSIBILITY FUTURE POINTS (DOCUMENT ONLY)
- If irregular plurals exist, a future `identity.entityNameOverride` could be added.
- Additional update phases for same baseline could be inferred if a task repeats `__UPDATE__` referencing same ordinal with different underscored fields (aggregate all or create separate scenarios sequentially).

## 13. QUALITY GATE
Agent must verify no cached variable without corresponding baseline and no update referencing missing baseline ordinal.

## 14. AMBIGUITY HANDLING & ESCALATION CLAUSE
If, during generation, the agent encounters an ambiguity that cannot be resolved via:
1. Direct inference rules in this prompt, AND
2. Data present in `folder.bru` required sections, AND
3. Values declared in `entity.config.json` (including overrides),

the agent MUST halt further scenario creation for the affected entity and request explicit user clarification before proceeding.

### 14.1 Examples of Ambiguities
- Multiple `__UPDATE__` task lines referencing the same ordinal with disjoint underscored fields and unclear intent (single combined update vs separate sequential updates) and no ordering hint.
- A task line uses an ordinal word (e.g. "third") when fewer baselines are defined by preceding `__CREATE__` lines.
- Underscored token not present in example data table nor API response sample, making type / path uncertain (e.g. `_proposedAcademicTerm_`).
- Descriptor mutation implied (token contains `descriptor`) but the field path cannot be located in the example JSON structure.
- Primary key field listed in config but missing from example data table AND not inferable from tasks text (risking incorrect query construction).
- Inconsistent pluralization leading to conflicting endpoint segment candidates (e.g. Folder `StaffLeaves` but docs reference `StaffAbsence`).

### 14.2 Mandatory Pre-Escalation Attempts
Before escalating, the agent must attempt:
1. Normalization (case-insensitive match, stripping descriptor URI fragments).
2. Singular/plural heuristic (add/remove trailing 's').
3. Camel ↔ snake / camel ↔ Pascal conversion to locate a field in the example JSON.
4. Cross-reference with primaryKeyFields to ensure not misclassifying a key as mutable.

If still unresolved → escalate.

### 14.3 Escalation Output Format
When escalating, emit a concise clarification block:
```
AMBIGUITY DETECTED:
Type: <field|ordinal|endpoint|update-collision|other>
Context: <short description>
Observed Source Text: "<raw line or token>"
Inference Attempts: [list of strategies tried]
Blocking Decision Needed: <explicit question to user>
Proposed Options:
  A) <option 1>
  B) <option 2>
  (Add more if applicable)
Please reply with the chosen option (A/B/..), or provide corrected definition.
```

### 14.4 Partial Progress Handling
If ambiguity affects only a subset of scenarios (e.g. update #2), the agent may still generate unambiguous baseline scenarios and explicitly mark the pending ones as deferred with placeholder filenames ending in `(pending-clarification).bru` containing a comment-only docs block describing the open question.

### 14.5 Non-Halting Minor Inconsistencies
Minor cosmetic inconsistencies (capitalization differences that do not alter path resolution) SHOULD be auto-normalized silently and NOT escalated.

This clause ensures the system fails safe—never silently guessing in ways that could hide data issues.

---
END OF GENERIC CONFIG-DRIVEN PROMPT
