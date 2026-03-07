# Requirements: Pitchr Project-Specific Rubric Context

**Defined:** 2026-03-05
**Core Value:** Users get feedback that reflects their actual project-specific rubric and constraints, not generic pitch advice.

## v1 Requirements

### Project Configuration

- [x] **PRJC-01**: User can open a selected project and access a dedicated `Rubric & Context` configuration section.
- [x] **PRJC-02**: User can paste project-specific rubric/context text and save it to that project.
- [ ] **PRJC-03**: System persists the saved rubric/context with `updated_at` and `updated_by` metadata.

### Permissions

- [ ] **PERM-01**: Only project owner/admin can create or update project rubric/context.
- [ ] **PERM-02**: Non-owner users cannot edit project rubric/context through UI or API.

### Scoring Integration

- [ ] **SCOR-01**: Every scoring run for a project automatically loads that project's saved rubric/context.
- [ ] **SCOR-02**: Scoring logic layers project rubric/context on top of the default rubric (does not replace baseline rubric).
- [ ] **SCOR-03**: Feedback output reflects project-specific rubric/context in recommendations and critique emphasis.
- [ ] **SCOR-04**: Run metadata stores which rubric/context reference was used for that run.

### Validation and UX Clarity

- [x] **VAL-01**: System validates rubric/context input as non-empty and within configured max length.
- [ ] **VAL-02**: Project settings clearly state that saved rubric/context is automatically applied to all project runs.
- [ ] **VAL-03**: If project rubric/context is unavailable or invalid at run time, system falls back to default rubric and records the event.

## v2 Requirements

### Input Expansion

- **INPT-01**: User can upload rubric documents (PDF/DOCX) and extract text automatically.
- **INPT-02**: User can manage multiple rubric/context entries per project with selection controls.

### Control and Transparency

- **CTRL-01**: User can optionally enable/disable project rubric/context per run.
- **CTRL-02**: Results view includes explicit rubric-influence explanation for each run.

## Out of Scope

| Feature | Reason |
|---------|--------|
| File upload and OCR/parsing in v1 | Increases scope and failure modes; v1 focuses on fast, reliable text input |
| Full replacement of default rubric | Reduces scoring consistency and comparability across runs |
| Per-run include/exclude toggle in v1 | Adds behavior ambiguity; v1 prioritizes predictable always-on project context |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PRJC-01 | TBD | Complete |
| PRJC-02 | TBD | Complete |
| PRJC-03 | TBD | Pending |
| PERM-01 | TBD | Pending |
| PERM-02 | TBD | Pending |
| SCOR-01 | TBD | Pending |
| SCOR-02 | TBD | Pending |
| SCOR-03 | TBD | Pending |
| SCOR-04 | TBD | Pending |
| VAL-01 | TBD | Complete |
| VAL-02 | TBD | Pending |
| VAL-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after initial definition*
