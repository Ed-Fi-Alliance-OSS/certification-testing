# Diagrams — Maintenance Guide

This folder holds everything needed to maintain and regenerate the roadmap diagrams for the Confluence page and the original Markdown document.

---

## File inventory

| File | Type | Purpose |
|---|---|---|
| `dependency_graph.mmd` | Mermaid source | Flowchart — sprint dependency flow (TB layout, LR inside subgraphs) |
| `sprint_gantt.mmd` | Mermaid source | Gantt — sprint timeline with ticket labels and dates |
| `burndown_xy.mmd` | Mermaid source | XY chart — story point burndown across sprints |
| `render_diagrams.ps1` | PowerShell script | Renders all `.mmd` files → `.png` using mermaid-cli |
| `*.png` | Generated images | Upload these to Confluence; re-generate as needed |

The `.mmd` files are the **source of truth**. Never edit the PNGs directly — always edit the `.mmd` then re-render.

---

## Tools used and why

### mermaid-cli (`@mermaid-js/mermaid-cli`)
Used to render `.mmd` diagram sources into PNG images. It runs headless Chrome under the hood via Puppeteer to produce pixel-accurate renders that match what VS Code and GitHub Markdown previews show.

- **Not** used for the Confluence text content — only for diagrams.
- PNGs are preferred over SVGs here because the SVG renderer produces minor layout differences compared to the browser preview.

### Pandoc (not currently used)
Pandoc could convert the Markdown to Confluence Storage Format (XHTML) automatically. It is **not used in this workflow** because:
- The Confluence document (`Certification 2.1 Roadmap.confluence.md`) is maintained manually as a close mirror of the original Markdown.
- Mermaid blocks are replaced with `[DIAGRAM: xxx.png]` placeholders and actual PNGs are uploaded manually.

If you want to automate the Markdown → Confluence conversion in the future, look into `pandoc --to=jira` or the Confluence REST API with Pandoc's `--to=html`.

---

## Prerequisites (one-time setup)

1. **Node.js** (v18+): https://nodejs.org/

2. **mermaid-cli**:
   ```powershell
   npm install -g @mermaid-js/mermaid-cli
   ```

3. **Chrome or Edge** must be installed (used by Puppeteer internally). The render script auto-detects common install paths. If it can't find a browser, set:
   ```powershell
   $env:PUPPETEER_EXECUTABLE_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
   ```
   Or install a headless shell directly:
   ```powershell
   npx puppeteer browsers install chrome-headless-shell
   ```

---

## How to update a diagram

1. Open the relevant `.mmd` file (e.g., `sprint_gantt.mmd`).
2. Edit the Mermaid source — refer to https://mermaid.js.org/syntax/ for syntax help.
3. Preview changes in VS Code using the **Markdown Preview** or a Mermaid extension.
4. Keep the corresponding block in `../Certification 2.1 Roadmap.md` in sync with the same edits.
5. Re-render (see below).

---

## How to re-generate PNGs

From this folder in PowerShell:

```powershell
.\render_diagrams.ps1
```

This regenerates all three PNGs in place. The script:
- Auto-detects Chrome/Edge for Puppeteer.
- Applies per-diagram width/height/scale settings for best quality.
- Falls back from a global `mmdc` install to `npx @mermaid-js/mermaid-cli` if needed.

To render a single diagram manually:
```powershell
npx @mermaid-js/mermaid-cli -i sprint_gantt.mmd -o sprint_gantt.png -w 1600 -H 700 --scale 2
```

---

## The Confluence document

`../Certification 2.1 Roadmap.confluence.md` is the Confluence-ready mirror of `../Certification 2.1 Roadmap.md`. Differences from the original:

- Mermaid code blocks are replaced with `[DIAGRAM: xxx.png]` placeholders (images are uploaded manually).
- Intended to be copy-pasted or uploaded to Confluence as-is; no Mermaid plugin required.

**Keep it in sync with the original Markdown** whenever either document changes. The two files have identical sections — update both at the same time.

---

## How to update the Confluence page

1. Edit `../Certification 2.1 Roadmap.md` (the source of truth).
2. Apply the same text changes to `../Certification 2.1 Roadmap.confluence.md` — replace any Mermaid blocks with `[DIAGRAM: xxx.png]` if you added new diagrams.
3. Re-generate PNGs if any `.mmd` was changed (see above).
4. Open the Confluence page → Edit.
5. For each updated diagram placeholder:
   - Remove the old image on the page.
   - Re-upload the new PNG from this folder (Insert → Files and images).
6. Paste any updated text sections from `Certification 2.1 Roadmap.confluence.md`.
7. Publish.

> **Tip:** if your Confluence instance has a Mermaid macro (available from the Atlassian Marketplace), you can replace the PNG images with the macro and paste the `.mmd` contents directly — no rendering step needed.

---

## Diagram layout notes

- **`dependency_graph.mmd`**: top-level `flowchart TB` (sprints flow top→bottom). Each subgraph uses `direction LR` with invisible links (`~~~`) between nodes to force the tickets inside each sprint to display left→right.
- **`sprint_gantt.mmd`**: standard Mermaid `gantt` block. Labels are plain text (no quotes, no HTML) to avoid rendering artefacts. Dates reflect actual sprint boundaries.
- **`burndown_xy.mmd`**: `xychart-beta` with both a `line` and `bar` series showing remaining story points at each sprint boundary.
