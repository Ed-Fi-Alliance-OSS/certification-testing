# MTSS (Intervention) Bruno Collection

Bruno certification steps for the Ed-Fi **Intervention (MTSS) v5** certification.
Business rules: [Intervention / MTSS API v5 Certification - Test Scenarios](https://edfi.atlassian.net/wiki/pages/viewpage.action?pageId=2939813909)
(Confluence). Work item: [CERT-275](https://edfi.atlassian.net/browse/CERT-275).

## Scope

Resources and scenarios follow the Confluence certification page above:

| In scope | Used by |
| --- | --- |
| Interventions | Publish and Maintain Intervention Definitions; OPTION 1 (`staffs`) |
| StudentInterventionAssociations | Assign a Student to an Intervention; OPTION 2 (`cohortReference`) |
| StudentInterventionAttendanceEvents | Record Intervention Participation Events; AssignedVersusDeliveredDosage |
| Cohorts, StaffCohortAssociations | Associate Staff with Intervention Delivery - [OPTION 2] |

All of them are also exercised by "Recovery and Resubmission Scenarios".

**Out of scope:** InterventionPrescriptions and InterventionStudies. They were candidates in
CERT-275, but the Confluence certification scenarios don't use them.

## Layout

`v5/intervention/<Scenario>/NN - <step>.bru`. Folders are per certification **scenario**,
not per resource (`<Area>/<EntityPlural>/` in SIS), because:

- each MTSS scenario spans several resources (for example, OPTION 2 creates a Cohort, two
  StaffCohortAssociations and updates a StudentInterventionAssociation);
- later scenarios reuse values captured by earlier ones, which `scenario.config.json`
  declares (`needs` / `provides`). The SIS `entity.config.json` has no way to express that.

Inside each scenario the SIS conventions are unchanged, so the Admin App catalog parser can
read the steps the same way: `folder.bru` docs with the `N. __CREATE|UPDATE|DELETE__` task
list, numbered steps with unique `seq`, `[ENTER …]` inputs, `setVars` and `logSpec`.
Loading MTSS in Admin App is AC-665: it adds a Certification Type column, removes the
hard-coded `SIS` root and reads `scenario.config.json`.

Run the scenarios in this order (folder `meta.seq`):

1. Publish and Maintain Intervention Definitions
2. Assign a Student to an Intervention
3. Record Intervention Participation Events
4. AssignedVersusDeliveredDosage
5. Associate Staff with Intervention Delivery - [OPTION 1] **or**
6. Associate Staff with Intervention Delivery - [OPTION 2]
7. Recovery and Resubmission Scenarios (always last: it deletes and re-checks your data)

## Options and optional steps

- `[OPTION N]`: complete **one** option of the "staff-delivery" group. Steps tagged with
  an option in other scenarios (for example Recovery) are required only for that option.
- `[optional]`: run the step only if it applies to your product.

Each scenario folder has a `scenario.config.json` (schema:
`../schemas/scenario-config.schema.json`) that records options, optional steps, and the
variables the scenario borrows from (`needs`) or shares with (`provides`) other scenarios.

A `needs` entry can name a variable that only an `[optional]` step provides (for example
the 6th attendance event from "Record Intervention Participation Events" step 08). The
consuming step treats it as optional and passes without it, so a readiness check (Admin
App, AC-666) must not block a scenario on variables provided only by optional steps.

## Fields marked CONDITIONAL

The "Scenarios example data" tables mark fields that are OPTIONAL in the Data Standard,
but that certification checks in the scenarios where the table lists a value, as
`CONDITIONAL` (the same convention as SIS). Those steps assert the field; the others don't.

## Variables across scenarios

Unlike SIS, later scenarios reuse values captured by earlier ones (ids and natural keys).
In the Bruno app and CLI these are runtime variables, so run the scenarios in order within
one session. A step that misses a value fails with a message naming the
`Scenario › step` to run first.

If Bruno is closed (or the environment switched) part-way, the captured values are lost.
Before "Recovery and Resubmission Scenarios" you can re-run the scenario that provides the
missing value. During Recovery you can't: the records it would read were deleted by
design. Start again from "Publish and Maintain Intervention Definitions" (Sample Data users
run `Sample Data › MTSS › Reset` first).

## Local dependencies

Same strategy as SIS: this folder has its own `package.json` (`dayjs`) because the Bruno
sandbox blocks `require()` from parent folders. `utils.js` and `logging.js` are this
collection's own copies; the MTSS helpers (dosage calculation, event checks, id lookups)
are unit-tested in `../tests-unit` (`npm test` from `bruno/`).
