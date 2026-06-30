---
name: generate-sample-data
description: "Generates Bruno sample data seed scripts (Step-N and Aux-N .bru files) for an Ed-Fi entity from its folder.bru scenario data table. Use when adding or updating Sample Data scripts in Sample Data/Resources/<Entity> V<N>/."
---

# Generate Sample Data Scripts

Generate Bruno `.bru` sample data seed scripts for a single Ed-Fi entity. These scripts live in `Sample Data/Resources/<EntityPlural> V<N>/` and seed the ODS/API with test data used by the read-only certification scenarios in `SIS/v<N>/`.

## Before You Start

Read `bruno/ai-docs/sample-data.spec.md` in full before doing anything else. All rules in that document are authoritative. This skill defines the workflow; the spec defines the rules. When they conflict, the spec wins — but surface the conflict to the user.

## Workflow

Complete these steps in order. Do not skip steps. Do not generate files until Step 4 is confirmed.

---

### Step 1 — Ask for the entity

Ask the user:

> "Which entity do you want to generate sample data for? Please provide the path relative to `bruno/SIS/` (e.g. `v5/StaffAssociation/Staffs` or `v4/EducationOrganizationCalendar/GradingPeriods`)."

Wait for the user's response.

---

### Step 2 — Read inputs

Read both input files in parallel:

1. `bruno/SIS/<path>/folder.bru` — parse the `docs {}` block:
   - `## Scenarios tasks` — extract operations (`__CREATE__`, `__UPDATE__`, `__DELETE__`), ordinals (`first`, `second`, ...), and referenced field names
   - `## Scenarios example data` — extract the full data table (all columns, all rows, Required/Optional/Conditional status)

2. `bruno/SIS/<path>/entity.config.json` — extract:
   - `identity.primaryKeyFields`
   - `identity.naturalIdField`
   - `identity.irregularPlural` (if present)
   - `overrides.entityName`, `overrides.endpointSegment` (if present)

---

### Step 3 — Consistency check

Before generating anything, validate all inputs against Section 12 of `sample-data.spec.md`.

**On any inconsistency — no matter how minor — pause immediately.**

For each issue found:
1. Describe it clearly to the user
2. State whether it looks like a typo or a possibly intentional pattern, and why
3. Ask for explicit confirmation on how to proceed

Do not group all issues into one message if they require independent decisions. Address them one at a time if needed.

Do not proceed to Step 4 until **all** flagged issues are resolved.

---

### Step 4 — Confirm plan with user

Present a summary for the user to approve before any files are created:

> "Here's what I'll generate for **`<EntityPlural> V<N>`**:
>
> - **Output folder:** `Sample Data/Resources/<EntityPlural> V<N>/`
> - **folder.bru** (seq: `<NEXT_SEQ>`)
> - **5 Aux files** (Aux 1–5, seq 1–5)
> - **`<N>` Step files:**
>   - Step 1 (seq 6) — `<METHOD>` — Scenario 1 (`<ordinal>` `__<TYPE>__`)
>   - Step 2 (seq 7) — `<METHOD>` — Scenario 2 (`<ordinal>` `__<TYPE>__`)
>   - ...
>
> Shall I proceed?"

Wait for user confirmation before continuing.

---

### Step 5 — Legacy folder check

Before creating any files, check whether any of these folders already exist:

- `Sample Data/Resources/<EntityPlural>/` (no version suffix — legacy)
- `Sample Data/Resources/<EntityPlural> V<N>/` (versioned target — already exists)

If the **legacy folder** exists without a version suffix, pause and ask:

> "A legacy folder `<EntityPlural>` exists without a version suffix. Should I: **(A)** rename it to `<EntityPlural> V<N>`, **(B)** delete it and create a fresh `<EntityPlural> V<N>` folder from scratch, or **(C)** keep it as-is and generate a new `<EntityPlural> V<N>` folder?"

If the **versioned target folder** already exists, pause and ask:

> "The folder `<EntityPlural> V<N>` already exists. Should I: **(A)** overwrite its contents, or **(B)** abort?"

Wait for the user's choice before touching anything.

---

### Step 6 — Generate files

Create the output folder and all files per `sample-data.spec.md`. Generate in this order:

1. `folder.bru`
2. `Aux 1 - <EntityPlural>.bru` (GET, seq 1)
3. `Aux 2 - <EntityPlural>.bru` (POST, seq 2)
4. `Aux 3 - <EntityPlural>.bru` (PUT, seq 3)
5. `Aux 4 - <EntityPlural> by Id.bru` (GET, seq 4)
6. `Aux 5 - <EntityPlural>.bru` (DELETE, seq 5)
7. `Step 1 - <EntityPlural>.bru` through `Step <N> - <EntityPlural>.bru` (seq 6 through 5+N)

Apply all rules from `sample-data.spec.md` exactly:
- Step numbering by execution order (position), not by numeric task label
- Local UUID capture always uses `const _UUID = ...`
- Step UUID variables: `temp<Ordinal><EntitySingular>UUID`
- Aux UUID variables: `temp<EntitySingular>UUID` (no ordinal)
- Placeholders: `[ENTER FIELD NAME]` (spaces, all caps)
- Non-PK fields in Aux 2 and Aux 3: Scenario 1 values
- Descriptor encoding: `uri://ed-fi.org/<DescriptorType>#<value>`
- Descriptor PKs in Aux 1: use sentinel pattern

---

### Step 7 — Verify

After generating all files, self-verify before presenting results:

- [ ] HTTP method is correct for each Step (POST for `__CREATE__`, PUT for `__UPDATE__`)
- [ ] All Step UUID variables follow `temp<Ordinal><EntitySingular>UUID`
- [ ] All Aux UUID variables follow `temp<EntitySingular>UUID` (no ordinal)
- [ ] Local capture variable is `_UUID` in every `script:post-response`
- [ ] All PK fields in Aux files use `[ENTER FIELD NAME]` placeholders (spaces, all caps)
- [ ] All non-PK Scenario 1 values are correctly populated in Aux 2 and Aux 3
- [ ] All descriptor values encoded as `uri://ed-fi.org/<DescriptorType>#<value>`
- [ ] Descriptor PK fields in Aux 1 use sentinel pattern
- [ ] Seq numbers are correct: Aux 1–5 = seq 1–5; Step N = seq 5+N
- [ ] Step numbering follows execution order, not task-line numeric labels
- [ ] No OPTIONAL field with a blank value was included (should be omitted)
- [ ] No REQUIRED or CONDITIONAL field with a blank value was omitted (should be `null`)

List all generated files with their seq, HTTP method, and scenario label.

---

### Step 8 — Ask user to review

> "Files generated in `Sample Data/Resources/<EntityPlural> V<N>/`. Please review them in Bruno and let me know if any corrections are needed."

---

## Deployment Note

This skill's source lives in the repository at:

```
bruno/ai-docs/skills/generate-sample-data/SKILL.md
```

To enable the `/superpowers:generate-sample-data` invocation, it must be deployed to:

```
~/.copilot/installed-plugins/superpowers-marketplace/superpowers/skills/generate-sample-data/SKILL.md
```

Use the `writing-skills` skill to deploy or update it after any changes.

---

## Key Principles

| Principle | Rule |
|-----------|------|
| **One entity at a time** | Stay focused on the entity the user specified. Do not generate files for other entities. |
| **Pause on inconsistency** | Never assume. Always describe the issue and ask the user to confirm before proceeding. |
| **Spec is authoritative** | `sample-data.spec.md` overrides any pattern observed in existing reference files. |
| **Scenario 1 for Aux** | Aux 2 and Aux 3 always use Scenario 1 data for non-PK fields. |
| **Execution order for Step numbering** | Use position in task list, not the numeric label on the task line. |
| **`_UUID` is always the local variable** | Never rename it per-entity. Consistency prevents typos. |
| **Confirm before creating** | Never create files without user approval of the plan (Step 4). |
