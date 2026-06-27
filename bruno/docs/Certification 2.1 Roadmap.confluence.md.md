# Roadmap for Certification 2.1 (DataStandard 5)

Spike of this research: https://edfi.atlassian.net/browse/CERT-232

**Team size:** 3 developers, 1 tester, 1 product owner
**Team capacity:** 40% (due to many running projects in parallel)
**Sprint length:** 2 weeks · **Full-capacity velocity:** ~35 pts/sprint · **Effective velocity at 40%:** ~14 pts/sprint
**Roadmap start date:** May 28, 2026

---

## Summary

| Metric | Value |
|---|---|
| Total dev story points | 42 |
| Completed (Sprint 1 + CERT-241) | 17 ✅ |
| **Remaining dev points** | **25 pts** |
| Phase 1 points (gated) | 8 pts |
| Phase 2 points (parallel) | 28 pts |
| Sprints needed | 3 |
| **Projected dev ETA** | **July 8, 2026** |
| With QA buffer sprint | July 15, 2026 |
| Documentation tickets | 7 (parallel, unestimated) |

---

## Tickets missing to develop as part of Certification 2.1

### Development Tickets

| Ticket | Points | Status | Phase | Category |
|---|---|---|---|---|
| [CERT-241](https://edfi.atlassian.net/browse/CERT-241) | 3 | ✅ Done | 1 | DS5 boilerplate |
| [CERT-247](https://edfi.atlassian.net/browse/CERT-247) | 5 | ✅ Done | 1 – Gated | Regression tests |
| [CERT-257](https://edfi.atlassian.net/browse/CERT-257) | 3 | ✅ Done | 1 – Gated | Pipeline stabilization |
| [CERT-242](https://edfi.atlassian.net/browse/CERT-242) | 2 | 🔵 Open | 2 – Parallel | Scenario updates |
| [CERT-243](https://edfi.atlassian.net/browse/CERT-243) | 3 | 🔵 Open | 2 – Parallel | New scenario |
| [CERT-244](https://edfi.atlassian.net/browse/CERT-244) | 3 | 🔵 Open | 2 – Parallel | New scenario |
| [CERT-245](https://edfi.atlassian.net/browse/CERT-245) | 3 | 🔵 Open | 2 – Parallel | New scenario |
| [CERT-246](https://edfi.atlassian.net/browse/CERT-246) | 3 | 🔵 Open | 2 – Parallel | Scenario updates |
| [CERT-239](https://edfi.atlassian.net/browse/CERT-239) | 3 | ✅ Done | 2 – Parallel | Scenario updates |
| [CERT-237](https://edfi.atlassian.net/browse/CERT-237) | 3 | ✅ Done | 2 – Parallel | Scenario updates |
| [CERT-250](https://edfi.atlassian.net/browse/CERT-250) | 1 | 🔵 Open | 2 – Parallel | Scenario updates |
| [CERT-252](https://edfi.atlassian.net/browse/CERT-252) | 2 | 🔵 Open | 2 – Parallel | Scenario updates |
| [CERT-256](https://edfi.atlassian.net/browse/CERT-256) | 5 | 🔵 Open | 2 – Parallel | Scenario updates |
| [CERT-258](https://edfi.atlassian.net/browse/CERT-258) | 1 | 🔵 Open | 2 – Parallel | Regression follow-up |
| [CERT-259](https://edfi.atlassian.net/browse/CERT-259) | 2 | 🔵 Open | 2 – Parallel | Regression follow-up |

> **Note:** Estimations are approximations based on original ticket estimates and complexity. They do **not** account for AI-assisted development using `bruno/ai-docs/spec.md`, which could meaningfully accelerate Phase 2 scenario tickets.

### Documentation Tickets

| Ticket | Status | Notes |
|---|---|---|
| [CERT-249](https://edfi.atlassian.net/browse/CERT-249) | 🔵 Open | Documentation updates |
| [CERT-248](https://edfi.atlassian.net/browse/CERT-248) | 🔵 Open | Documentation updates |
| [CERT-235](https://edfi.atlassian.net/browse/CERT-235) | 🔵 Open | Documentation updates |
| [CERT-251](https://edfi.atlassian.net/browse/CERT-251) | 🔵 Open | Documentation updates |
| [CERT-253](https://edfi.atlassian.net/browse/CERT-253) | 🔵 Open | Documentation updates |
| [CERT-254](https://edfi.atlassian.net/browse/CERT-254) | 🔵 Open | Documentation updates |
| [CERT-255](https://edfi.atlassian.net/browse/CERT-255) | 🔵 Open | Documentation updates |

> Although these tickets are assigned to Certification 2.2, they will be moved to Certification 2.1, as they are part of the work that needs to be done for Certification 2.1, and they are not being worked on as part of Certification 2.2.

---

## Dependency Graph

Sprint flow: CERT-241 (Done) enables Sprint 1, which unblocks Sprint 2 and Sprint 3 sequentially. Most tickets within each sprint run in parallel. Ticket details are grouped by sprint assignment.

[DIAGRAM: dependency_graph.png]

---

## Sprint Gantt Chart

[DIAGRAM: sprint_gantt.png]

---

## Burndown Chart

Story points remaining at the end of each sprint, based on the dependency-gated execution plan.

[DIAGRAM: burndown_xy.png]

> Sprint 1 burns 14 pts (exactly at capacity). Sprint 2 burns 11 pts (~3 pts buffer). Sprint 3 burns 11 pts including CERT-256 (5 pts, high complexity) — ~3 pts of buffer remaining for bugs or unplanned work.

---

## ETA & Risks

### Projected Timeline

| Milestone | Date |
|---|---|
| Roadmap start | May 28, 2026 |
| Sprint 1 end — Phase 1 parallel + scenario updates (14 pts) | June 10, 2026 |
| Sprint 2 end — scenario updates + new scenarios (11 pts) | June 24, 2026 |
| Sprint 3 end — **Dev complete**, CERT-256 + new scenarios (11 pts) | **July 8, 2026** |
| QA buffer end (1 week) | July 15, 2026 |
| Documentation complete (target) | July 8, 2026 |

### Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| CERT-247 regression tests may uncover new defects or unestimated issues | Unplanned scope added mid-Sprint 1 or Sprint 2 | Log all findings as new tickets during Sprint 1; triage and size at Sprint 1 review before locking Sprint 2 scope |
| Point estimates were sized by a domain expert; 2 of 3 developers are new to the codebase | Sprint 1–2 effective velocity may drop to ~10–12 pts — could add 1 sprint (worst-case ETA: **July 22, 2026**) | Pair new devs on simpler scenario update tickets first; re-baseline velocity at Sprint 1 review |
| Estimations not yet refined | Scope creep in Phase 2 | Refine tickets at Sprint 1 kickoff; add buffer sprint if >35 pts after refinement |
| AI tooling (`spec.md`) not factored into estimates | ETA may be pessimistic | Re-baseline after Sprint 1 actuals are known |
| 7 doc tickets have no point estimates | Doc lane may slip | Size docs at Sprint 1 planning; allocate dedicated doc assignee |
| CERT-236 explicitly out of scope | — | Confirmed won't-do; no action needed |

---

(Notes)

- Mermaid source files live in `bruno/docs/diagrams/`. If you want editable diagrams in Confluence, consider installing a Mermaid macro from the Atlassian Marketplace; otherwise upload the generated PNGs.

- Added tickets from regression testing: [CERT-258](https://edfi.atlassian.net/browse/CERT-258) (1pt) and [CERT-259](https://edfi.atlassian.net/browse/CERT-259) (2pt). Both are scheduled in Sprint 2.
