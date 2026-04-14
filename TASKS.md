# TASKS.md
## Execution Roadmap for Collaborative 3D MVP

# Milestone 1: Single-player foundation
- [ ] Create React + TypeScript app shell
- [ ] Add Three.js viewport
- [ ] Define `SceneObject` and `ProjectDocument` types
- [ ] Implement primitive creation: box, sphere, cylinder
- [ ] Implement object selection
- [ ] Implement move / rotate / scale
- [ ] Implement duplicate / delete
- [ ] Implement scene tree
- [ ] Add local JSON save/load

# Milestone 2: Collaboration-ready state
- [ ] Refactor app state into semantic document model
- [ ] Separate render state from document state
- [ ] Introduce transaction boundaries for object mutations
- [ ] Define operation helpers for create/update/delete/group

# Milestone 3: Realtime collaboration
- [ ] Add Yjs document
- [ ] Add room sync provider
- [ ] Sync scene objects through Yjs
- [ ] Add awareness / presence
- [ ] Add remote selections
- [ ] Add object lock / edit ownership

# Milestone 4: Undo/redo
- [ ] Define local history model
- [ ] Group drag operations
- [ ] Add per-user undo/redo
- [ ] Validate redo under remote edits
- [ ] Add history regression tests

# Milestone 5: Persistence
- [ ] Create backend project schema
- [ ] Add project create/load/save endpoints
- [ ] Add permissions / sharing model
- [ ] Add snapshot support

# Milestone 6: Reliability and polish
- [ ] Add collaboration regression suite
- [ ] Add reconnect handling
- [ ] Add conflict/lock visibility improvements
- [ ] Add comments if time allows
- [ ] Update `memory.md` with important lessons

# First coding target
Build the smallest interactive prototype that proves:
- semantic scene model
- collaborative sync
- per-user undo/redo
- object lock while editing