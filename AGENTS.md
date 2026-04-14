# AGENTS.md
## Project: Collaborative 3D Design Tool for Industrial Designers

---

# 1. Project Mission

Build a browser-based 3D design tool for **industrial designers** that supports:

- real-time collaboration
- per-user undo/redo
- simple early-stage 3D form creation
- fast iteration
- intuitive designer-first workflows

This product is for **early concept exploration**, not full engineering CAD.

The product should feel like:

**“Figma for early 3D concept modeling”**

not:

**“A full SolidWorks replacement.”**

---

# 2. Product Context

Industrial designers often sketch ideas quickly, but turning rough concepts into editable 3D models is slow and technically demanding in traditional CAD tools.

This project exists to make that transition faster and more collaborative.

The tool should help designers:

- block out form quickly
- collaborate live in the same 3D file
- review concepts together
- make changes without breaking flow
- trust undo/redo while multiple people are editing

---

# 3. Primary User

## Target user
Industrial designers / product designers in early concept development.

## Main jobs to solve
- create rough product forms
- explore proportions
- review concepts with teammates
- collaborate without screen-sharing
- iterate faster than traditional CAD workflows

## Not the primary user in V1
- mechanical engineers doing manufacturing CAD
- assembly-heavy CAD users
- tolerance-precision workflows
- advanced surfacing specialists
- simulation-heavy users

---

# 4. V1 Scope

## Must have
- browser-based 3D workspace
- create primitive objects
- select / move / rotate / scale
- duplicate / delete
- group / ungroup
- scene tree / object list
- material or color editing
- real-time collaboration
- live presence
- object lock / edit ownership
- per-user undo/redo
- save/load project
- project sharing

## Good if time allows
- comments pinned in 3D
- snapshots / versions
- review mode
- import reference images
- glTF export

## Must NOT be built in V1
- full parametric CAD tree
- sketch solver
- assemblies and mates
- manufacturing constraints
- advanced freeform surfacing
- simulation
- production drawings
- raw mesh collaborative editing
- plugin marketplace

---

# 5. Core Product Principles

1. **Designer-first**
   - Optimize for speed, clarity, and creative flow.

2. **Collaboration-first**
   - Multiplayer is core architecture, not a later add-on.

3. **Per-user undo/redo**
   - My undo should undo my work, not everyone’s.

4. **Semantic scene model**
   - Sync scene objects and user intent, not raw mesh data.

5. **Smallest useful product first**
   - Build concept modeling before advanced CAD.

6. **Clarity over complexity**
   - Predictable collaboration beats theoretically perfect but confusing systems.

---

# 6. Required Technical Direction

Preferred stack unless there is a strong reason to change:

## Frontend
- React
- TypeScript
- Vite or Next.js

## 3D
- Three.js
- application-owned scene graph abstraction
- transform gizmo and interaction system

## Collaboration
- Yjs preferred default
- Yjs Awareness for presence
- Y.UndoManager for per-user history
- WebSocket provider for sync

Alternative allowed:
- Liveblocks if speed of implementation matters more than low-level control

## Backend
- Node.js + TypeScript
- auth
- projects
- permissions
- snapshots
- asset APIs

## Database / Storage
- Postgres for project metadata and permissions
- object storage for assets, previews, exports, snapshots

---

# 7. Shared Data Model Direction

The app must be built around a **shared scene document**.

Do NOT build the architecture around raw render output.

## Example document shape

```ts
type ProjectDocument = {
  id: string;
  name: string;
  scene: {
    objects: Record<string, SceneObject>;
    rootOrder: string[];
  };
  comments: Record<string, CommentEntity>;
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
};