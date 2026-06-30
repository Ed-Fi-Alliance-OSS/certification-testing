# Repository Skills

This folder contains custom AI agent skills for the `certification-testing` project. Skills are reusable workflow guides that the GitHub Copilot agent follows when invoked via `/superpowers:<skill-name>`.

---

## What Is a Skill?

A skill is a `SKILL.md` file that instructs the AI agent on *how* to perform a specific, repeatable task. Skills in this folder are project-specific — they encode domain knowledge (Ed-Fi entities, Bruno patterns, folder conventions) that a generic agent wouldn't otherwise know.

Each skill folder follows this structure:

```
skills/
  <skill-name>/
    SKILL.md          # Required — the skill instructions
    <other files>     # Optional supporting files (templates, reference docs)
```

---

## Available Skills

| Skill | Invocation | Purpose |
|-------|------------|---------|
| `generate-sample-data` | `/superpowers:generate-sample-data` | Generates Bruno `Step-N` and `Aux-N` seed scripts for one Ed-Fi entity from its `folder.bru` scenario data table |

---

## How to Use a Skill

1. Open GitHub Copilot Chat in VS Code
2. Type the invocation command, e.g.:
   ```
   /superpowers:generate-sample-data
   ```
3. The skill will guide you step-by-step — it will ask for the entity, validate inputs, confirm the plan, and generate the files

> **Note:** Skills must be deployed before they can be invoked. See [Deploying a Skill](#deploying-a-skill) below.

---

## Deploying a Skill

Skills in this repo are the **source of truth** but must be copied to the local superpowers directory to be invokable. The deployment target is:

```
~/.copilot/installed-plugins/superpowers-marketplace/superpowers/skills/<skill-name>/SKILL.md
```

### Option A — Using the `writing-skills` superpowers skill (Recommended)

```
/superpowers:writing-skills
```

Tell it: *"Deploy the skill at `bruno/ai-docs/skills/<skill-name>/SKILL.md` to the superpowers skills folder."*

It will handle copying and verification.

### Option B — Manual copy (PowerShell)

```powershell
$skillName = "generate-sample-data"
$src = "bruno\ai-docs\skills\$skillName"
$dst = "$env:USERPROFILE\.copilot\installed-plugins\superpowers-marketplace\superpowers\skills\$skillName"

New-Item -ItemType Directory -Force -Path $dst
Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force

Write-Host "Deployed: $skillName"
```

Run this from the repository root.

### Verifying Deployment

After deploying, verify the skill is available:
1. Open GitHub Copilot Chat
2. Type `/superpowers:` — the skill name should appear in the autocomplete list
3. Or invoke it directly and confirm it responds with the expected first step

---

## Adding a New Skill

1. Create a folder: `bruno/ai-docs/skills/<skill-name>/`
2. Create `SKILL.md` with a YAML frontmatter header:
   ```markdown
   ---
   name: skill-name
   description: "Use when [specific triggering condition]."
   ---
   ```
3. Write the skill workflow (see `generate-sample-data/SKILL.md` as an example)
4. Add a row to the [Available Skills](#available-skills) table above
5. Deploy using Option A or Option B

### Guidelines

- **One skill = one focused task.** If a skill is doing two unrelated things, split it.
- **Reference spec docs, don't duplicate them.** Skills should instruct the agent to read `sample-data.spec.md` or `spec.md` — not copy their content inline.
- **Always include a consistency-check step.** Skills that generate files must pause and ask the user when they detect ambiguities or unexpected patterns.
- **Source lives here; deployed copy is disposable.** Always edit the file in this repo — never edit the deployed copy directly, as it will be overwritten on next deploy.

---

## Related Files

| File | Purpose |
|------|---------|
| `bruno/ai-docs/spec.md` | Rules for generating SIS read-only certification test scenarios |
| `bruno/ai-docs/sample-data.spec.md` | Rules for generating Sample Data seed scripts (used by `generate-sample-data` skill) |
