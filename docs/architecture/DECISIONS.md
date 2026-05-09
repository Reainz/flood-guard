# Architecture Decision Records

Each decision is logged here with context, options considered, and rationale.
Agents should read the relevant ADR before refactoring a component.

---

## ADR-001: Rule-based flood prediction, not ML

**Date:** 2026-05-02
**Status:** Accepted

**Context:** We need to predict flood arrival time and depth from river level
and rainfall data. ML models (LSTM, gradient boosting) could give higher
accuracy given enough training data.

**Decision:** Use a rule-based threshold model for the hackathon MVP.

**Rationale:**
- Vietnamese river level data (MRC) is available but not in a clean ML-ready
  format without significant preprocessing time
- Rule-based model is explainable — judges and farmers can understand "if river
  rises 8cm/hr from 3.8m, flood arrives in ~25 hours"
- Rule-based model is debuggable in real time during the demo
- IRRI and MRC publish the exact thresholds we encode
- ML can be added post-hackathon with 30 days of collected sensor data

**Consequences:** Prediction accuracy is lower than ML would achieve.
We mitigate by being honest: "our MVP uses threshold rules calibrated to
MRC historical data; production would train on multi-year gauge records."

---

## ADR-002: Hardcode IRRI crop loss tables, never fetch them

**Date:** 2026-05-02
**Status:** Accepted

**Context:** The IRRI Knowledge Bank is a website, not an API. We could
scrape it or replicate the tables in our code.

**Decision:** Hardcode the tables in `backend/harvest/irri_tables.py` with
explicit citations.

**Rationale:**
- IRRI data is stable peer-reviewed science — it does not change frequently
- Scraping a website introduces a runtime dependency that breaks the offline story
- Hardcoded tables with citations are auditable and reproducible
- Judges can verify our numbers against the published source

**Consequences:** Tables must be manually updated if IRRI publishes new research.
A CI check (`scripts/check_irri_freshness.py`) will warn if tables are >2 years old.

---

## ADR-003: FastAPI over Django/Flask

**Date:** 2026-05-02
**Status:** Accepted

**Decision:** Use FastAPI for the backend.

**Rationale:**
- Automatic OpenAPI documentation — useful when demoing to judges
- Pydantic models enforce the contract between layers mechanically
- Async support for parallel external API calls (OWM + MRC simultaneously)
- Fast to set up, minimal boilerplate
- The team has existing FastAPI experience

---

## ADR-004: Mobile-responsive web app as fallback over native React Native

**Date:** 2026-05-02
**Status:** Accepted for hackathon, revisit post-hackathon

**Context:** React Native + Expo gives a better native experience (camera,
GPS, offline storage). But Expo setup time can be 4–6 hours for a team
unfamiliar with the toolchain.

**Decision:** Build mobile-responsive React web app as primary demo surface.
Use Expo only if both SE students are confident in the setup time.

**Rationale:**
- The demo HTML file (floodguard-demo.html) already exists and works
- Judges judge the demo experience, not the native/web implementation detail
- Web app can use `navigator.geolocation` for GPS and `<input type=file capture=camera>`
  for photos — no Expo required
- A working web demo beats a broken native demo every time

**Consequences:** Photo GPS metadata is less reliable on web than native.
Mitigate by overlaying the browser's `navigator.geolocation` coordinates
onto the photo at upload time.

---

## ADR-005: Distributed AGENTS.md files, not one monolith

**Date:** 2026-05-02
**Status:** Accepted

**Context:** Codex performs better with focused, relevant context.
A single large AGENTS.md crowds out task context and rots quickly.

**Decision:** Root AGENTS.md is a table of contents only. Each domain
has its own AGENTS.md. Skills are in `.agents/skills/`.

**Rationale:** Directly following OpenAI's harness engineering guidance:
"treat AGENTS.md as the table of contents, not the encyclopedia."
Domain-specific files can be maintained by the engineer/agent closest
to that domain. Agents working on harvest logic read only harvest docs.
Agents working on alerts read only alert docs. Context stays relevant.

**Consequences:** More files to maintain. Mitigated by CI checking that
all modules referenced in root AGENTS.md map have a corresponding file.
