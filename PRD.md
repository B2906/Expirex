# ExpireX Product Requirements Document

**Document status:** Draft for product, design, engineering, QA, operations, and business review  
**Product:** ExpireX - expiry-aware logistics recovery and digital-twin operations workspace  
**Scope:** Existing CSV-backed recovery intelligence product and its user-facing operational workflows  
**Date:** 2026-09-19  

## Document conventions and scope baseline

- **Requirement ID convention:** `F-` identifies features, `P-` pages/states, `J-` journeys, `BR-` business rules, `MET-` success metrics, `KPI-` leadership KPIs, `NFR-` non-functional requirements, and `NG-` non-goals. Feature acceptance criteria use the parent feature ID plus `AC-###` (for example, `F-003-AC-001`).
- **Discovery basis:** Existing ExpireX repository structure, backend/API behavior, persisted shipment and recovery outputs, and current Dashboard, Shipments, Shipment Details, Digital Twin, and Analytics workflows.
- **Items discovered:** 7 product capabilities, 6 user-facing page or state types, 7 user journeys, 12 business rules, 10 success metrics, 4 KPIs, 21 non-functional requirements, and 8 non-goals.
- **Items in scope:** Read-only operational visibility and interpretation of existing records. Source dataset editing, algorithm regeneration, allocation mutation, authentication lifecycle, commercial workflows, and customer self-service are excluded or TBD as identified below.
- **Source-of-truth boundary:** Persisted shipment, anomaly, recovery path, assignment, and Monte Carlo records are authoritative for displayed facts. Decision Assessment is a derived presentation policy and must never overwrite persisted allocation status.

## 1. Product

### 1.1 Vision

Enable logistics teams to recover time-sensitive shipments before expiry by making anomalies, available recovery paths, allocation outcomes, simulation evidence, and operational recommendations visible in one trusted workspace.

### 1.2 Mission

ExpireX consolidates shipment and network data, identifies shipment anomalies, presents persisted recovery paths and allocation outcomes, communicates observed Monte Carlo recovery evidence, and helps operators prioritize human attention without changing the underlying persisted recovery decisions.

### 1.3 Problem

Operators need to answer, for each affected shipment:

- What happened and where is the shipment now?
- Which recovery paths exist?
- Was a path allocated?
- What evidence supports the selected path?
- Which allocated shipments require review?

Without a unified view, anomaly state can be confused with allocation state, low observed simulation confidence can be mistaken for a failed allocation, and operators must reconcile separate datasets manually.

### 1.4 Opportunity

Expiring or time-sensitive logistics incidents create avoidable loss when detection, recovery planning, allocation, and operational follow-up are disconnected. A shared operational view can reduce investigation effort, improve prioritization, and provide auditable evidence for recovery decisions.

### 1.5 Value proposition

ExpireX gives logistics operators a single, evidence-oriented view of shipment incidents and recovery decisions while preserving the distinction between persisted facts and derived operational assessment.

### 1.6 Target users

| Group | Scope |
|---|---|
| Primary | Logistics control-tower operators and recovery coordinators |
| Secondary | Operations managers, supply-chain analysts, demonstrators, and QA reviewers |
| Excluded | Shippers or recipients managing individual consumer deliveries; external carriers making binding bids; users administering source datasets |

### 1.7 Personas

| ID | Persona | Goals | Pain points | Constraints | Product relevance |
|---|---|---|---|---|---|
| PER-001 | Control-tower operator | Find incidents, understand allocation, prioritize review | Fragmented records and ambiguous statuses | Must act quickly using existing evidence | Primary user of all operational pages |
| PER-002 | Operations manager | Monitor aggregate recovery performance and risk | Cannot see distribution or unresolved workload clearly | Needs summaries without losing drill-down | Dashboard and Analytics |
| PER-003 | Recovery analyst | Compare routes, cost, hops, score, fallback, and simulation evidence | Candidate paths and outcomes are difficult to reconcile | Needs traceable persisted values | Shipment Details and Digital Twin |
| PER-004 | QA/demo reviewer | Validate that displayed values match source data | Presentation layers may obscure source meaning | Needs deterministic test cases | All pages and acceptance checks |

### 1.8 Jobs-to-be-done

| ID | User | Situation | Job statement | Desired outcome | Current alternative | Opportunity |
|---|---|---|---|---|---|---|
| JTBD-001 | Operator | A shipment anomaly is detected | Determine the shipment state, anomaly, and current location | Incident is understood without dataset reconciliation | Manually inspect CSVs | Unified shipment and anomaly context |
| JTBD-002 | Operator | A recovery path is available | Determine whether recovery was allocated and what was selected | Allocation decision is visible and not confused with anomaly status | Inspect assignment output | Separate allocation status and route evidence |
| JTBD-003 | Analyst | Confidence evidence exists | Interpret simulation counts and observed confidence | Human review is prioritized without claiming delivery certainty | Recalculate or inspect files | Clear persisted simulation presentation |
| JTBD-004 | Manager | Several incidents are active | Assess workload and confidence distribution | Decisions are prioritized at portfolio level | Build ad hoc summaries | Dashboard and Analytics |
| JTBD-005 | Operator | Network context is needed | View hubs, routes, and selected recovery path spatially | Recovery network is understandable | Inspect route records | Interactive digital-twin view |

### 1.9 Key entities

| Entity | Meaning | Important attributes | Relationships |
|---|---|---|---|
| Shipment | A logistics item tracked by ExpireX | Shipment ID, origin hub, destination hub, weight, priority, ship time, deadline, shipment state | May have anomaly, assignment, paths, and Monte Carlo evidence |
| Anomaly | A detected deviation associated with a shipment | Shipment ID, deviation type, last-known hub, severity score | Belongs to a shipment; does not determine allocation status |
| Hub | A logistics network node | Hub ID, name, location, capacity, processing delay | Connects to routes and shipment movement |
| Route | A possible network connection | Route ID, origin, destination, capacity, cost | Connects hubs and may appear in candidate or selected recovery paths |
| Recovery path | A persisted candidate or selected multi-hop route | Route IDs, hop count, score, cost, deadline margin | Belongs to a shipment and may be selected by an assignment |
| Assignment | Persisted recovery allocation outcome | Shipment ID, allocation status, selected path, bid, cost, fallback flag | Belongs to a shipment and governs Allocation Status |
| Monte Carlo result | Persisted simulation evidence | Simulations, successful, failed, confidence, arrival fields | Belongs to a shipment; does not change assignment |
| Decision Assessment | Derived operational interpretation | Allocation status, confidence, assessment, reason | Derived from Assignment and Monte Carlo result; never persisted as allocation |

## 2. Features

### F-001 - Operational dashboard (Required)

**Purpose:** Provide a high-level view of current shipment, anomaly, allocation, and confidence workload.  
**User:** PER-001, PER-002.  
**Trigger:** User opens the product or Dashboard page.  
**Workflow:** Load current summary data, show headline metrics, show assessment breakdown, and provide links to affected shipment details.  
**Expected behavior:** The dashboard displays total shipments, detected anomalies, allocated and rejected counts where available, confidence summary, active incidents, and dynamically derived Decision Assessment counts. Allocation metrics remain separate from Decision Assessment metrics.  
**Business rules:** BR-001 through BR-006.  
**Dependencies:** Persisted shipment, anomaly, assignment, and Monte Carlo records.  
**Edge cases:** Empty anomaly set, no allocation records, missing confidence, partial data, and unavailable service.  
**Failure states:** Show an explicit loading or error state; do not show success-shaped fabricated metrics.  
**Permissions:** Read access to operational data; exact role model TBD.  
**Acceptance criteria:**  
1. **F-001-AC-001:** Given valid records, when the page loads, then headline counts match the loaded records.  
2. **F-001-AC-002:** Given allocated records with confidence, when assessments are shown, then counts are calculated dynamically and do not replace allocation counts.  
3. **F-001-AC-003:** Given unavailable data, when loading fails, then the page communicates the failure and provides a retry or navigation path.  
**Scope status:** Required.

### F-002 - Shipment search and list (Required)

**Purpose:** Let operators find and compare shipments.  
**User:** PER-001, PER-003, PER-004.  
**Trigger:** User opens Shipments or searches/filter/sorts.  
**Workflow:** Display records, filter by searchable fields, sort supported columns, and open a shipment detail view.  
**Expected behavior:** The list distinguishes anomaly, shipment state, Allocation Status, Decision Assessment, and Monte Carlo confidence.  
**Business rules:** BR-001, BR-002, BR-004, BR-005.  
**Dependencies:** Shipment and joined operational records.  
**Edge cases:** No results, null fields, duplicate display records, very long identifiers.  
**Failure states:** Explain unavailable list data without presenting an empty result as a successful query.  
**Permissions:** Read access; exact role model TBD.  
**Acceptance criteria:**  
1. **F-002-AC-001:** Given S0149, when displayed, then Allocation Status is `ALLOCATED`, confidence is `35.3%`, and assessment is `REVIEW REQUIRED`.  
2. **F-002-AC-002:** Given a shipment without assignment, when displayed, then its anomaly state is not used as Allocation Status.  
3. **F-002-AC-003:** Given a selected row, when the user activates it, then the corresponding detail page opens.  
**Scope status:** Required.

### F-003 - Shipment detail and recovery decision (Required)

**Purpose:** Present the complete persisted evidence for one shipment.  
**User:** PER-001, PER-003, PER-004.  
**Trigger:** User selects a shipment.  
**Workflow:** Load shipment, anomaly, recovery, assignment, Monte Carlo, and explanation data; present movement context, recovery candidates, selected allocation, simulation evidence, and assessment.  
**Expected behavior:** The page separately labels Anomaly/Shipment State, Allocation Status, Monte Carlo Confidence, Simulation Results, Decision Assessment, candidate paths, fallback, and explanation.  
**Business rules:** BR-001 through BR-009.  
**Dependencies:** Shipment identifier and available persisted records.  
**Edge cases:** Missing assignment, missing Monte Carlo record, missing arrival timestamps, missing candidate path, fallback allocation, and partial endpoint responses.  
**Failure states:** Missing records are labeled unavailable or unresolved; the page never invents confidence, dates, routes, or counts.  
**Permissions:** Read access; exact role model TBD.  
**Acceptance criteria:**  
1. **F-003-AC-001:** Given S0149, when details load, then the page shows `ALLOCATED`, `35.3%`, `1000`, `353`, `647`, and `REVIEW REQUIRED`.  
2. **F-003-AC-002:** Given S0003, when details load, then the page shows `ALLOCATED`, `96.0%`, `1000`, `960`, `40`, and `RECOMMENDED`.  
3. **F-003-AC-003:** Given no Monte Carlo record, when details load, then confidence is `CONFIDENCE UNAVAILABLE`, simulation fields are not fabricated, and arrival fields are `Not available`.  
4. **F-003-AC-004:** Given anomaly state `MISPLACED`, when details load, then it appears only as shipment/anomaly context and never as Allocation Status.  
5. **F-003-AC-005:** Given a candidate path, when details load, then route IDs, hops, score, cost, deadline margin, allocation status, and fallback information are shown when persisted.  
**Scope status:** Required.

### F-004 - Recovery network digital twin (Required)

**Purpose:** Show hubs, routes, shipment locations, and selected recovery paths in network context.  
**User:** PER-001, PER-003.  
**Trigger:** User opens Digital Twin or selects a shipment.  
**Workflow:** Display network, select shipment, highlight origin/current/destination and selected recovery route, and show recovery metadata.  
**Expected behavior:** Map and route presentation remains consistent with persisted shipment and assignment records.  
**Business rules:** BR-001, BR-002, BR-004, BR-007.  
**Dependencies:** Hubs, routes, shipments, misplaced events, and recovery assignments.  
**Edge cases:** Missing coordinates, missing selected route, shipment without recovery, and map tile/service failure.  
**Failure states:** Preserve non-map shipment information when map rendering fails.  
**Permissions:** Read access; exact role model TBD.  
**Acceptance criteria:**  
1. **F-004-AC-001:** Given a selected allocated shipment, when the detail panel loads, then Allocation Status and assessment are shown separately.  
2. **F-004-AC-002:** Given no confidence, when the detail panel loads, then confidence is labeled unavailable.  
3. **F-004-AC-003:** Given a selected recovery path, when the map loads, then its route is visually distinguished without changing routing data.  
**Scope status:** Required.

### F-005 - Analytics and confidence reporting (Required)

**Purpose:** Help managers and analysts understand anomaly, route, cost, allocation, and confidence patterns.  
**User:** PER-002, PER-003, PER-004.  
**Trigger:** User opens Analytics.  
**Workflow:** Load aggregate records, render confidence distribution, and render a separate assessment breakdown.  
**Expected behavior:** Confidence distribution is labeled as persisted simulation evidence; Decision Assessment is labeled as a prototype operational policy.  
**Business rules:** BR-003 through BR-006.  
**Dependencies:** Dashboard, shipment, route, recovery, and Monte Carlo records.  
**Edge cases:** Empty categories, missing confidence, partial records, and inconsistent source rows.  
**Failure states:** Explain unavailable analytics data and avoid misleading zeroes.  
**Permissions:** Read access; exact role model TBD.  
**Acceptance criteria:**  
1. **F-005-AC-001:** Given loaded data, when Analytics renders, then confidence distribution and assessment breakdown are separate sections.  
2. **F-005-AC-002:** Given the prototype threshold, when the breakdown renders, then the threshold is identified as a Prototype Decision Policy, not an industry standard.  
3. **F-005-AC-003:** Given missing confidence, when counts render, then the record is counted as Confidence Unavailable rather than Review Required.  
**Scope status:** Required.

### F-006 - Explainability and evidence interpretation (Required)

**Purpose:** Explain why a persisted route/allocation is shown without overstating simulation meaning.  
**User:** PER-001, PER-003, PER-004.  
**Trigger:** User views Shipment Details.  
**Workflow:** Show anomaly type, persisted route evidence, allocation status, confidence interpretation, and fallback.  
**Expected behavior:** Explanation states that confidence is the observed proportion of successful persisted simulations and does not claim probability of delivery or guaranteed outcome.  
**Business rules:** BR-002 through BR-005.  
**Dependencies:** Explanation, assignment, anomaly, and Monte Carlo records.  
**Edge cases:** Missing explanation, missing anomaly, missing confidence, and unresolved allocation.  
**Failure states:** Use explicit unavailable wording.  
**Permissions:** Read access; exact role model TBD.  
**Acceptance criteria:**  
1. **F-006-AC-001:** Given an allocated low-confidence shipment, when explanation renders, then it states that the path was allocated and human review is recommended.  
2. **F-006-AC-002:** Given an anomaly type, when explanation renders, then anomaly type and Allocation Status are separate fields.  
3. **F-006-AC-003:** Given missing confidence, when explanation renders, then it does not call the shipment low confidence.  
**Scope status:** Required.

### F-007 - Operational status and error states (Required)

**Purpose:** Make loading, offline, empty, partial, and not-found states understandable.  
**User:** All product users.  
**Trigger:** Any page request or interrupted service.  
**Workflow:** Show loading state, success state, explicit failure, and recovery action.  
**Expected behavior:** Status communication identifies whether the issue is data unavailable, shipment not found, or service unavailable.  
**Business rules:** BR-010 through BR-012.  
**Dependencies:** Data availability and page navigation.  
**Edge cases:** Timeout, malformed data, stale browser bundle, and temporary backend outage.  
**Failure states:** No silent fallback to fabricated or stale-looking values.  
**Permissions:** Read access; exact role model TBD.  
**Acceptance criteria:** Every primary page has observable loading, success, empty, and failure states, and a user can navigate back to a usable page after an error.  
**Scope status:** Required.

## 3. Pages and product states

| ID | Page | Purpose | Required information | Actions | States | Features |
|---|---|---|---|---|---|---|
| P-001 | Dashboard | Portfolio operational summary | Shipment, anomaly, allocation, confidence, assessment metrics | Navigate to incidents and sections | Loading, success, empty, error, degraded | F-001, F-007 |
| P-002 | Shipments | Searchable shipment list | ID, hubs, destination, priority, anomaly, Allocation Status, assessment, confidence | Search, filter, sort, open detail | Loading, results, no results, error | F-002, F-007 |
| P-003 | Shipment Details | Evidence and recovery decision for one shipment | Movement, anomaly, candidates, allocation, simulation, assessment, explanation | Return, inspect route, inspect fallback | Loading, success, not found, partial, error | F-003, F-006, F-007 |
| P-004 | Digital Twin | Spatial network and selected shipment context | Hubs, routes, selected path, shipment state, allocation, assessment | Select shipment, filter, focus network | Loading, success, map degraded, empty, error | F-004, F-007 |
| P-005 | Analytics | Aggregate patterns and distributions | Anomaly, severity, route, cost, allocation, confidence, assessment | Filter or inspect charts where available | Loading, success, empty, error | F-005, F-007 |
| P-006 | Not-found / unavailable state | Explain missing resource or service | Error reason and recovery action | Retry, back, navigate | Not found, offline, partial | F-007 |

## 4. User journeys

### J-001 - Onboarding and activation

**Entry:** User opens the product URL.  
**Steps:** The user sees system status, opens Dashboard, reviews headline metrics, and opens one affected shipment.  
**Validation:** The dashboard must load valid data or communicate the unavailable state.  
**Activation point:** The user can identify one affected shipment and its Allocation Status plus Decision Assessment.  
**Failure/recovery:** On service failure, the user sees an explicit error and can retry or navigate; no values are invented.

### J-002 - Investigate an anomalous shipment

**Starting condition:** The Shipments page contains an affected shipment.  
**Steps:** Search or select shipment; review anomaly state; open details; compare current hub, destination, candidate paths, assignment, and fallback.  
**Completion:** The user can distinguish anomaly state from Allocation Status and identify the selected path.  
**Recovery:** If the shipment is not found, return to the list; if records are partial, inspect available fields labeled by availability.

### J-003 - Prioritize recovery review

**Starting condition:** An allocated shipment has persisted Monte Carlo evidence.  
**Steps:** Review confidence and simulation counts; compare against the prototype 90% policy; inspect explanation.  
**Completion:** The user sees `RECOMMENDED` or `REVIEW REQUIRED` without interpreting confidence as delivery probability.  
**Recovery:** Missing confidence results in `CONFIDENCE UNAVAILABLE`, not a low-confidence decision.

### J-004 - Monitor portfolio

**Starting condition:** Manager opens Dashboard or Analytics.  
**Steps:** Review allocated/rejected metrics; review assessment breakdown; inspect confidence distribution; drill into a shipment.  
**Completion:** Manager understands workload and evidence distribution.  
**Recovery:** Empty or partial categories are explicitly labeled.

### J-005 - Inspect network context

**Starting condition:** User opens Digital Twin.  
**Steps:** Select shipment; inspect origin, current/misplaced hub, destination, selected path, allocation, assessment, and fallback.  
**Completion:** User understands the recovery path spatially.  
**Recovery:** If mapping is degraded, shipment and route metadata remain available.

### J-006 - Error and recovery handling

| Error | Impact | Communication | Available action | Completion |
|---|---|---|---|---|
| Service unavailable | Data cannot be loaded | Explicit offline/error state | Retry or navigate | User reaches loaded or stable error state |
| Shipment not found | Detail unavailable | Not-found message | Return to list | User can select another shipment |
| Missing assignment | Allocation unknown | `UNRESOLVED` | Inspect anomaly/evidence | User is not shown a false allocation |
| Missing Monte Carlo | Confidence unknown | `CONFIDENCE UNAVAILABLE` | Inspect persisted route data | User is not shown fabricated evidence |
| Partial data | Some fields unavailable | Field-level unavailable labels | Continue with available data | User can distinguish facts from gaps |

### J-007 - Account, logout, and deletion

Authentication, profiles, preferences, logout, and deletion are not established in the current product definition. They are **TBD**. No account, logout, or deletion behavior may be inferred from the current read-only workspace.

## 5. Business rules

| ID | Rule | Condition and outcome | Exceptions | Priority |
|---|---|---|---|---|
| BR-001 | Separate anomaly and allocation state | Shipment/anomaly state such as `MISPLACED` must never be used as Allocation Status | None | Critical |
| BR-002 | Persisted allocation authority | Assignment/recovery status is the source for Allocation Status | If absent, show `UNRESOLVED` | Critical |
| BR-003 | Confidence source | Monte Carlo fields are displayed only from a persisted Monte Carlo record | Missing record means unavailable | Critical |
| BR-004 | Prototype recommendation policy | Allocated + confidence >= 90% = `RECOMMENDED`; allocated + confidence < 90% = `REVIEW REQUIRED` | 90% is demo policy, not an industry standard | Critical |
| BR-005 | Missing confidence policy | Allocated with missing/invalid confidence = `CONFIDENCE UNAVAILABLE` | Do not classify as low confidence | Critical |
| BR-006 | No viable recovery | Rejected, unresolved, unallocated, or absent allocation = `NO VIABLE RECOVERY` | Exact source status vocabulary may expand | High |
| BR-007 | Evidence interpretation | Confidence is the observed proportion of successful persisted simulations | Must not be described as probability of delivery | Critical |
| BR-008 | No fabricated values | Missing paths, dates, counts, costs, and confidence display unavailable values | None | Critical |
| BR-009 | Candidate path fidelity | Candidate route, hops, score, cost, deadline margin, allocation, and fallback reflect persisted data | Missing field is labeled unavailable | High |
| BR-010 | Explicit loading | Every data-dependent page communicates loading before success or failure | None | High |
| BR-011 | Explicit failure | Request or parsing failures are communicated and recoverable | None | High |
| BR-012 | Read-only presentation boundary | The product presentation layer must not change persisted allocation, routing, scoring, auction, or Monte Carlo results | Future write workflows require separate approval | Critical |

## 6. Success metrics

| ID | Metric | Definition / formula | Unit | Baseline | Target | Frequency | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| MET-001 | Activation rate | Users who identify one shipment and its Allocation Status / product sessions | % | TBD | TBD | Weekly | Product analytics | Product |
| MET-002 | Detail task completion | Sessions reaching a shipment detail and viewing allocation plus assessment / detail sessions | % | TBD | TBD | Weekly | Product analytics | Product |
| MET-003 | Status interpretation accuracy | QA/user tests correctly distinguishing anomaly state from Allocation Status | % correct | Current defect observed | 100% target | Release | QA test results | QA |
| MET-004 | Evidence completeness | Required persisted fields displayed when present / required fields available | % | TBD | TBD | Release | Data reconciliation tests | Engineering |
| MET-005 | Missing-data honesty | Tests with missing confidence that avoid fabricated confidence or counts / missing-confidence tests | % | Current target | 100% | Release | QA test results | QA |
| MET-006 | Review prioritization | Allocated records correctly classified by prototype policy / eligible allocated records | % | TBD | 100% | Daily/release | Assessment reconciliation | Operations |
| MET-007 | Investigation time | Median time from opening product to identifying allocation and assessment for a selected shipment | Minutes | TBD | TBD | Monthly | Session analytics | Operations |
| MET-008 | Availability | Time product is usable or provides a stable degraded/error state | % | TBD | TBD | Monthly | Operational monitoring | Engineering |
| MET-009 | Error recovery | Failed sessions that reach a successful retry or usable fallback / failed sessions | % | TBD | TBD | Monthly | Product analytics | Engineering |
| MET-010 | Operational efficiency | Manual reconciliation time avoided per incident compared with current workflow | Minutes saved | TBD | TBD | Quarterly | Operator study | Operations |

## 7. KPIs

| ID | KPI | Why it matters | Formula | Target | Leading indicators | Lagging indicators | Review |
|---|---|---|---|---|---|---|---|
| KPI-001 | Affected shipment resolution visibility | Measures whether operators can see incident outcomes | Affected shipments with visible anomaly, allocation, and assessment / affected shipments | TBD | Detail completion, evidence completeness | Reduced unresolved investigation backlog | Weekly |
| KPI-002 | Recovery review coverage | Measures whether low-evidence allocations receive attention | Allocated shipments classified and surfaced for review / allocated shipments | TBD | Assessment reconciliation | Review completion rate | Daily |
| KPI-003 | Data trust accuracy | Protects operational trust | Correctly mapped persisted fields / fields tested | 100% | Automated reconciliation pass rate | User-reported data mismatch rate | Release/monthly |
| KPI-004 | Recovery operations efficiency | Measures business value of the workspace | Baseline investigation time - ExpireX investigation time | TBD | Activation and task completion | Operator hours saved | Monthly |

## 8. Non-functional requirements

### Performance

- **NFR-001:** For a normal operating dataset, 95% of page requests must present either usable content or an explicit error state within **TBD** seconds.
- **NFR-002:** Shipment search and filtering must present updated results within **TBD** seconds after user input.
- **NFR-003:** A shipment detail must display all available persisted sections without requiring repeated manual refresh.

### Scalability

- **NFR-004:** The product must support growth in shipment, route, anomaly, and simulation records up to a volume defined by operations: **TBD**.
- **NFR-005:** Increased data volume must not cause records to be silently omitted; truncation or pagination behavior must be explicit.

### Availability and degraded operation

- **NFR-006:** During a temporary data-service outage, the product must show an explicit offline/degraded state and must not display fabricated operational metrics.
- **NFR-007:** A failure in the map view must not prevent available shipment and recovery metadata from being displayed.

### Accessibility

- **NFR-008:** All primary navigation, controls, tables, filters, and shipment links must be keyboard operable.
- **NFR-009:** Status, severity, confidence, and assessment must not rely on color alone.
- **NFR-010:** Loading, error, empty, and validation messages must be available to assistive technologies.
- **NFR-011:** Text and controls must remain usable at 200% text enlargement without loss of essential information.

### Security and permissions

- **NFR-012:** Users must only access operational data permitted by the product's approved access model; the model is **TBD**.
- **NFR-013:** Sensitive operational data must not be exposed in error messages beyond the user's authorized scope.
- **NFR-014:** Any future write, export, or administrative action must require an explicit permission definition before release.

### Privacy

- **NFR-015:** The product must document what shipment and operational data is collected, displayed, retained, and deleted before production launch; retention is **TBD**.
- **NFR-016:** Data must not be displayed to unauthorized users or copied into user-facing diagnostics.

### Observability

- **NFR-017:** The product must make page-load failures, not-found events, data-mapping failures, assessment classification outcomes, and successful primary-task completion measurable.
- **NFR-018:** Operational records used for displayed metrics must be traceable to their source dataset or service response.

### Reliability and integrity

- **NFR-019:** Repeated reads must not mutate persisted shipment, allocation, route, scoring, or Monte Carlo results.
- **NFR-020:** Missing or malformed fields must result in explicit unavailable values rather than guessed values.
- **NFR-021:** Duplicate requests or refreshes must not create duplicate operational records.

## 9. Non-goals

| ID | Non-goal | Reason | Explicit exclusion | Future consideration |
|---|---|---|---|---|
| NG-001 | Recalculate recovery algorithms in the presentation product | Preserve existing persisted results | No new routing, scoring, auction, or Monte Carlo calculation | Separate optimization product |
| NG-002 | Change persisted allocation decisions | Allocation is an upstream pipeline output | No automatic reallocation | Operator-approved workflow, TBD |
| NG-003 | Treat confidence as delivery probability | Persisted value is an observed simulation proportion | No guarantee or certainty claim | Domain validation, TBD |
| NG-004 | Build a 3D logistics simulation | 2D network context is sufficient for current scope | No 3D engine | Future visualization study |
| NG-005 | Manage carrier contracts, bidding, billing, or pricing | Not defined in current product | No binding commercial transaction | Commercial module, TBD |
| NG-006 | Provide shipper/recipient self-service | Primary users are internal operations teams | No customer portal | Future product boundary decision |
| NG-007 | Add user accounts, SSO, profiles, logout, or deletion workflows | Requirements are not established | No inferred account lifecycle | Define in a future security/product decision |
| NG-008 | Modify source CSV datasets from the UI | Current data is read-only persisted evidence | No dataset editor or regeneration | Governance workflow, TBD |

## 10. Requirement traceability

| Problem | Persona | JTBD | Feature | Page | Journey | Business rules | Metrics/KPIs |
|---|---|---|---|---|---|---|---|
| Status ambiguity | PER-001, PER-004 | JTBD-001, JTBD-002 | F-002, F-003, F-006 | P-002, P-003 | J-002, J-003 | BR-001, BR-002, BR-007 | MET-003, MET-004, KPI-003 |
| Fragmented recovery evidence | PER-001, PER-003 | JTBD-002, JTBD-003 | F-003, F-006 | P-003 | J-002, J-003 | BR-003, BR-008, BR-009 | MET-004, MET-005 |
| Portfolio workload is unclear | PER-002 | JTBD-004 | F-001, F-005 | P-001, P-005 | J-004 | BR-004, BR-005, BR-006 | MET-001, MET-006, KPI-001, KPI-002 |
| Network context is unclear | PER-001, PER-003 | JTBD-005 | F-004 | P-004 | J-005 | BR-001, BR-007, BR-009 | MET-007, KPI-004 |
| Service/data failures are confusing | All | JTBD-001 through JTBD-005 | F-007 | P-006 and all pages | J-006 | BR-008, BR-010, BR-011 | MET-008, MET-009 |

Unresolved product decisions requiring ownership:

- Approved authentication and authorization model: **TBD**.
- Data retention, deletion, and privacy classification: **TBD**.
- Supported scale and performance targets: **TBD**.
- Production availability objective and support hours: **TBD**.
- Ownership of persisted dataset quality and correction workflow: **TBD**.

## 11. Final PRD quality check

- Every feature, page, journey, business rule, metric, KPI, NFR, and non-goal has a unique ID.
- Persisted allocation status is separated from anomaly/shipment status.
- Monte Carlo confidence is treated as observed persisted simulation evidence.
- Missing confidence and missing allocation have explicit states.
- Core features have users, purpose, workflow, business rules, dependencies, edge cases, failure states, permissions, and acceptance criteria.
- Dashboard, Shipments, Shipment Details, Digital Twin, Analytics, and failure states are represented.
- Primary and secondary workflows include success and recovery paths.
- Undefined account, privacy, governance, scale, availability, and retention decisions are marked TBD.
- No requirement authorizes modification of persisted datasets or upstream recovery algorithms.
