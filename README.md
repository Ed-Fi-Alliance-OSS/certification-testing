# Ed-Fi Certification Testing

Test scripts for the Ed-Fi Certification process.

In 2024-2025, the Alliance is testing an approach to move from manual validation
with SQL scripts to using the API itself for validation. This approach seeks to
bring in as much automation as possible, using
[Postman](https://www.postman.com/) as the platform of choice. The goal of this
is to streamline operations for the Ed-Fi Alliance, speed up development and
certification times for our partners by allowing our partners to perform more of
their own testing.

## SIS Certification User Manual

If you are a SIS vendor tester using the Bruno app (GUI), please refer to the end-user manual:

- [Ed‑Fi SIS Certification — How to Use (Bruno GUI)](bruno/README-User-Manual.md)

This manual provides version-agnostic setup, `.env` credentials, environment selection, and step-by-step scenario execution guidance.

## Testing GitHub Actions Locally

For contributors who want to validate workflows (e.g., Bruno lint) without pushing to GitHub, see:

- [Local Actions Testing Guide](.github/TESTING_ACTIONS_LOCALLY.md)

The guide covers installing `act`, running specific workflows, handling artifacts, and common troubleshooting tips.

## Automated Scenario Runner

For advanced, automated execution of Bruno scenarios (intended for contributors and CI, not required for SIS vendor testers), see:

- [Scenario Runner Guide](scripts/run-scenarios.README.md)

This guide explains the `run-scenarios.cjs` script, configuration, outputs, and flags for batch runs.

## Scenario Generation Spec (AI‑Gen)

For teams working with automated generation of SIS certification scenarios, see the project specification:

- [AI‑Gen Scenario Specification](bruno/ai-docs/spec.md)

This document defines folder structure conventions, entity configuration requirements, descriptor encoding (sentinel pattern), assertion strategy (REQUIRED vs OPTIONAL/CONDITIONAL), logging rules, and naming standards used by the AI‑driven scenario generation.

## Bruno Collection Guide (Developer‑Focused)

For engineers working directly with the Bruno collections, scripting, and advanced patterns, see:

- [Bruno Collection README (developer guide)](bruno/README.md)

This guide covers Developer Mode, external libraries, script lifecycle, assertions, reporting/automation, and contribution patterns.

## Legal Information

Copyright (c) 2024 Ed-Fi Alliance, LLC and contributors.

Licensed under the [Apache License, Version 2.0](./LICENSE) (the "License").

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
