
---

# `memory.md`

```md
# memory.md
## Project Memory and Mistake Prevention Log

This file exists so agents learn from mistakes and avoid repeating them.

For every major bug, architecture issue, scope mistake, or user-experience failure:

1. record what happened
2. explain why it happened
3. write a prevention rule
4. define required follow-up

All agents must consult this file before major work.

---

# 1. Permanent Rules

## Rule 1: Do not turn V1 into full CAD
**Why:** Full CAD complexity will destroy focus and delay the product.

**Prevention:**
- Ask whether the feature directly helps early-stage collaborative concept modeling.
- If not essential, defer it.

---

## Rule 2: Do not use raw mesh sync as the main collaborative model
**Why:** Raw mesh sync makes collaboration, merging, and undo/redo much harder.

**Prevention:**
- Use semantic scene objects as the primary collaborative state.
- Sync user intent and object-level changes first.

---

## Rule 3: Undo must be per-user, not global
**Why:** Global undo in multiplayer is destructive and confusing.

**Prevention:**
- Track user-local history.
- Validate history behavior under concurrent edits.

---

## Rule 4: Drag interactions must be grouped into one undo entry
**Why:** Frame-by-frame history creates unusable undo stacks.

**Prevention:**
- Begin grouped action on pointer down.
- Commit one action on pointer up.

---

## Rule 5: Do not tightly couple render state and document state
**Why:** This creates brittle code and sync bugs.

**Prevention:**
- Keep rendering, shared document, and ephemeral interaction state clearly separated.

---

## Rule 6: Prefer edit clarity over maximum concurrency
**Why:** Users trust predictable collaboration more than unlimited simultaneous editing freedom.

**Prevention:**
- Use object-level locking or ownership in V1.
- Allow broader concurrency later only when behavior is well-defined.

---

## Rule 7: Keep the UI designer-friendly
**Why:** The target user is an industrial designer, not a CAD power user.

**Prevention:**
- Favor simple language and obvious actions.
- Avoid engineering-heavy UI unless necessary.

---

## Rule 8: No feature is complete if it breaks multiplayer trust
**Why:** Collaboration is core to the product.

**Prevention:**
- Every shared-state feature must be reviewed for remote behavior, ownership, and recovery.

---

# 2. Known Risk Areas

## Risk: scope creep
**Warning signs:**
- feature tree discussions
- sketch solver work
- mate systems
- manufacturing tolerances
- engineering workflows dominating roadmap

**Response:**
- Product Manager Agent reviews immediately
- Usually defer from V1

---

## Risk: collaboration bolted on too late
**Warning signs:**
- single-player architecture getting deep
- no shared semantic document
- presence not considered
- no transaction boundaries

**Response:**
- Architect Agent and Collaboration Agent must refactor early before adding more features

---

## Risk: broken undo/redo
**Warning signs:**
- undo affects other users
- drag floods history
- redo breaks after remote edits
- delete/duplicate restore incorrectly

**Response:**
- stop feature expansion
- Undo/Redo Agent and QA Agent fix the history model first

---

## Risk: confusing ownership of edits
**Warning signs:**
- users do not know who is editing an object
- simultaneous edits produce surprising results
- locks are unclear or absent

**Response:**
- improve visible edit ownership
- simplify concurrency model

---

## Risk: overcomplicated UX
**Warning signs:**
- too many tools visible
- too many modes
- unclear next action
- interface feels like engineering CAD too early

**Response:**
- Frontend UX Agent simplifies
- remove or hide nonessential controls

---

# 3. Multi-Agent Learning Rules

## Product Manager Agent
Must log when the team nearly drifted out of scope.

## System Architect Agent
Must log when a shortcut caused structural confusion or bad coupling.

## Frontend UX Agent
Must log when users are confused by flows, labels, or collaboration visibility.

## 3D Engine Agent
Must log interaction bugs, transform correctness issues, or scene integrity failures.

## Realtime Collaboration Agent
Must log sync inconsistencies, lock conflicts, reconnect bugs, or remote-state surprises.

## Undo/Redo Agent
Must log any bug involving grouped actions, redo corruption, or local-vs-remote history confusion.

## Backend / Data Agent
Must log persistence mismatches, project corruption risks, or schema design mistakes.

## QA / Reliability Agent
Must log missing regression coverage that allowed bugs through.

## Memory / Learning Agent
Must turn all meaningful repeated failures into permanent prevention rules when needed.

---

# 4. Pre-Implementation Checklist

Before implementing a feature, check:

- Is it in V1 scope?
- Does it help early-stage collaborative 3D design?
- Does it keep the product designer-friendly?
- Does it preserve semantic scene modeling?
- Is it safe in multiplayer?
- Does it preserve per-user undo/redo?
- Is it testable with clear success criteria?

If multiple answers are “no,” defer the feature.

---

# 5. Post-Task Learning Template

Use this after any major bug, architecture problem, or repeated confusion.

## Entry: [date] [agent] [task/feature]

**What was attempted:**  
Describe the task.

**What went wrong:**  
Describe the bug, mistake, confusion, or failure.

**Why it happened:**  
Describe root cause.

**Prevention rule:**  
Write a short future rule.

**Required follow-up:**  
List tests, refactors, docs, or UX changes required.

---

# 6. Example Entries

## Entry: Example - Undo/Redo Agent - drag created 120 undo steps

**What was attempted:**  
Implemented object dragging in viewport.

**What went wrong:**  
Each mouse move created a separate history item.

**Why it happened:**  
Transform updates were recorded per frame instead of as a grouped action.

**Prevention rule:**  
All pointer-driven transforms must be grouped from pointer down to pointer up.

**Required follow-up:**  
Refactor drag interaction and add regression tests for grouped undo behavior.

---

## Entry: Example - Realtime Collaboration Agent - remote edits broke redo

**What was attempted:**  
Added live object transforms across multiple users.

**What went wrong:**  
Redo became inconsistent after remote edits.

**Why it happened:**  
The redo model mixed local action history with remote-applied state changes.

**Prevention rule:**  
Redo must only track user-local actions and be tested under concurrent remote updates.

**Required follow-up:**  
Separate local history from remote sync application and add concurrency tests.

---

## Entry: Example - System Architect Agent - render layer owned document logic

**What was attempted:**  
Quickly connected viewport objects directly to shared document state.

**What went wrong:**  
Render-specific assumptions leaked into document logic and made refactors difficult.

**Why it happened:**  
The module boundary between scene model and render layer was unclear.

**Prevention rule:**  
Render adapters must consume scene state; they must not define document structure.

**Required follow-up:**  
Refactor module boundaries and document ownership clearly.

---

## Entry: 2026-04-05 Memory / Learning Agent - duplicate starter code conflicted with canonical architecture

**What was attempted:**  
Scaffolded the initial monorepo, agent docs, shared schema, collaboration server, history layer, and web editor shell.

**What went wrong:**  
Older prototype files with different package names and data models were still present in active compile paths, which caused hidden conflicts with the new starter architecture.

**Why it happened:**  
The repository contained multiple partial starter implementations at once, but the active entrypoints and tsconfig scopes were not narrowed to a single canonical system.

**Prevention rule:**  
When resetting or scaffolding core architecture, audit the active compile paths first and remove or isolate obsolete prototype entrypoints before adding new foundations.

**Required follow-up:**  
Keep one canonical package namespace, keep exported entrypoints minimal, and verify searches for stale package names or retired model shapes after major scaffolding.

---

## Entry: 2026-04-05 Memory / Learning Agent - stale join snapshots overrode collaborative client state

**What was attempted:**  
Connected the browser editor to the live collaboration room with optimistic local operations and snapshot-based room sync.

**What went wrong:**  
The collaboration client could accept an older join snapshot after newer local optimistic state already existed, which made shared state appear inconsistent or reset unexpectedly.

**Why it happened:**  
The client treated every incoming snapshot as authoritative without comparing revisions or accounting for the initial synchronization boundary.

**Prevention rule:**  
Collaboration clients must ignore stale snapshots, treat revision ordering explicitly, and avoid enabling document mutations until the initial authoritative room snapshot has been received.

**Required follow-up:**  
Keep revision-aware snapshot handling in the editor shell and add explicit browser-level collaboration tests around join, reconnect, and immediate-create timing.

---

## Entry: 2026-04-05 Memory / Learning Agent - collaboration rooms must survive reloads

**What was attempted:**  
Used an in-memory room store as the initial collaboration backend for shared scene documents.

**What went wrong:**  
Refreshing or reopening a room could appear to reset the shared model because room state only lived in the current server process.

**Why it happened:**  
Presence and live broadcast worked, but the server did not persist canonical room documents outside process memory.

**Prevention rule:**  
Shared room state must be persisted outside transient process memory, even in local development, so reload and reconnect paths can restore the same canonical document for a room ID.

**Required follow-up:**  
Keep file-backed persistence for development, replace it with Postgres/object-storage snapshots for production, and include reload/restart coverage in collaboration tests.

---

## Entry: 2026-04-07 Backend / Data Agent - workspace cwd changed snapshot storage path

**What was attempted:**  
Added local file-backed room snapshots so shared rooms could reload the canonical document by room ID.

**What went wrong:**  
The snapshot directory was derived from `process.cwd()`, so running the server through an npm workspace could point persistence at a different folder than expected.

**Why it happened:**  
The server assumed it would always be launched from the repository root, but `npm run dev -w apps/server` starts from the app workspace context.

**Prevention rule:**  
Persistence paths must be module-relative or explicitly configured; do not derive durable storage paths from the caller's current working directory.

**Required follow-up:**  
Keep storage paths deterministic in local development and carry the same explicit configuration rule into the future Postgres/object-storage snapshot layer.

---

## Entry: 2026-04-07 Realtime Collaboration Agent - client trace fabricated server acknowledgements

**What was attempted:**  
Displayed a collaboration trace so users and developers could see submitted operations and server acknowledgements.

**What went wrong:**  
The trace created a fake `server:ops-accepted` entry locally before the server actually acknowledged the operation, which made failed or unsent operations look accepted.

**Why it happened:**  
The trace helper mixed local submit preview data with authoritative server events instead of keeping client intent and server acknowledgement separate.

**Prevention rule:**  
Collaboration diagnostics must never fabricate authoritative server events; traces must clearly distinguish local intent, socket delivery state, queued messages, and actual server acknowledgements.

**Required follow-up:**  
Keep `client:submit-ops`, `client:submit-status`, `server:snapshot`, and real `server:ops-accepted` as separate trace events, and add a browser-level regression test for the displayed collaboration trace.

---

## Entry: 2026-04-07 Backend / Data Agent - explicit save must update live room and persisted snapshot together

**What was attempted:**  
Added a user-triggered Save action so a room can be reopened by room ID with the previously saved structured document.

**What went wrong:**  
Saving only to disk would not update the already-open in-memory room, while saving only in memory would not survive reload or restart.

**Why it happened:**  
The collaboration runtime and the persisted snapshot are two separate holders of canonical state during development.

**Prevention rule:**  
Any explicit save path must update both the live room document and the persisted snapshot atomically enough for the next join to see the same state.

**Required follow-up:**  
Carry the same rule into the production Postgres/object-storage save path and add UI-level regression coverage for Save, refresh, and rejoin.

---

## Entry: 2026-04-07 Realtime Collaboration Agent - stale revision recovery must replay pending local operations

**What was attempted:**  
Supported optimistic local collaboration operations against a server-authoritative room document.

**What went wrong:**  
When another collaborator changed the room first, the local client could hit a revision rejection, resync, and silently lose its own pending change instead of recovering it.

**Why it happened:**  
The client tracked only a set of pending transaction ids, not the actual ordered operation batches needed to rebuild local intent on top of a fresh snapshot.

**Prevention rule:**  
Optimistic collaboration clients must retain ordered pending operation batches and replay them after any authoritative resync caused by revision drift.

**Required follow-up:**  
Keep edits disabled until the first room snapshot is loaded, preserve replay coverage for create/edit command chains, and add browser-level regression coverage for two tabs editing the same room concurrently.

---

## Entry: 2026-04-09 Realtime Collaboration Agent - stale websocket close cleared the active connection

**What was attempted:**  
Maintained a reconnecting browser websocket for room join, presence, and operation sync.

**What went wrong:**  
The UI could show `connected` and keep receiving earlier state, but later edit submits saw `socketReadyState: null` because the active socket reference had been cleared unexpectedly.

**Why it happened:**  
Close events from an older websocket instance could still run after a newer socket had become active, and the close handler cleared the shared socket ref without checking whether the closing socket was the current one.

**Prevention rule:**  
Realtime websocket clients must treat socket events as instance-scoped; stale socket `open`, `message`, `error`, and `close` events must never mutate the active connection state for a newer socket.

**Required follow-up:**  
Keep instance-aware socket lifecycle tests, and add a browser-level regression test that covers reconnects under React development behavior and multi-tab editing.

---

# 7. Workflow Rule

Before coding:
- read `AGENTS.md`
- read `memory.md`

After major work:
- update `memory.md` if a non-trivial lesson was learned

If the same class of bug appears twice:
- promote the lesson into a stronger permanent rule
