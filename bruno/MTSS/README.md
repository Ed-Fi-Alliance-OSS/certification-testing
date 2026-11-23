# MTSS (Intervention) Bruno Collection

Bruno certification steps for the Ed-Fi **Intervention (MTSS) v5** certification.
Design: `docs/superpowers/specs/2026-11-19-mtss-intervention-bruno-design.md`.

## Layout

`v5/intervention/<Scenario>/NN - <step>.bru`, the same layout as SIS so the Admin App
catalog parser can read it. Scenario folders are named after the behaviour they certify,
not after a single resource.

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

## Variables across scenarios

Unlike SIS, later scenarios reuse values captured by earlier ones (ids and natural keys).
In the Bruno app and CLI these are runtime variables, so run the scenarios in order within
one session. A step that misses a value fails with a message naming the
`Scenario › step` to run first.

## Local dependencies

Same strategy as SIS: this folder has its own `package.json` (`dayjs`) because the Bruno
sandbox blocks `require()` from parent folders. `utils.js` and `logging.js` are this
collection's own copies; the MTSS helpers (dosage calculation, event checks, id lookups)
are unit-tested in `../tests-unit` (`npm test` from `bruno/`).
