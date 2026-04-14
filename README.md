# Figma for 3D Concept Modeling

Browser-based collaborative 3D design workspace for early industrial design exploration.

This project is aimed at the stage before production CAD: quick form blocking, shared reviews, live co-editing, and per-user undo/redo on a semantic scene model instead of raw mesh syncing.

## What It Does Today

- create primitive forms in the browser
- create sketch planes, add rectangular sketch curves, and extrude them into bodies
- inspect scene nodes in a scene panel
- rename, move, and delete selected nodes
- show live collaborator presence in the same room
- keep per-user undo/redo history on the client
- sync document operations through a WebSocket collaboration server
- save and reload room documents from local disk on the server

## Product Direction

The intended product is:

- fast early-stage 3D concept modeling
- collaboration-first
- designer-first instead of engineering-CAD-first

The intended product is not:

- a SolidWorks replacement
- a parametric manufacturing CAD system
- a full assembly, tolerance, or simulation workflow

## Tech Stack

- React + Next.js + TypeScript
- Three.js via React Three Fiber
- Node.js + TypeScript WebSocket server
- npm workspaces monorepo

## Repository Layout

```text
apps/
  web/              Next.js editor UI
  server/           WebSocket collaboration server with local document persistence
packages/
  3d-core/          scene document helpers and display mesh derivation
  collab/           room store and operation application logic
  history/          per-user undo/redo manager
  protocol/         client/server message types
  shared/           canonical document, command, and operation types
agents/             role notes and project guidance
tools/              local helper scripts
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Quick Start

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Start both the web app and collaboration server:

```bash
npm run dev
```

4. Open the editor:

```text
http://localhost:3000
```

The web client expects the collaboration server at `ws://localhost:8787` by default.

## Run Individual Services

Start only the web app:

```bash
npm run dev:web
```

Start only the collaboration server:

```bash
npm run dev:server
```

## Environment

This repo currently works without a required `.env` file.

Optional environment variables:

- `NEXT_PUBLIC_COLLAB_URL`: override the WebSocket server URL used by the web app
- `PORT`: override the collaboration server port, default `8787`

Example:

```bash
NEXT_PUBLIC_COLLAB_URL=ws://localhost:8787 npm run dev:web
PORT=8787 npm run dev:server
```

## How To Use The App

### 1. Enter a shared room

Open the app in a browser. By default it uses the room `shared-demo-room`.

You can also join a custom room with query parameters:

```text
http://localhost:3000?room=my-concept-review
```

Useful query parameters:

- `room`: collaboration room / document id
- `name`: display name shown in presence
- `color`: presence color

Example:

```text
http://localhost:3000?room=my-concept-review&name=Mia&color=%231d6c74
```

### 2. Create geometry

Use the toolbar to:

- add a `Box`
- add a `Cylinder`
- add a `Sketch Plane`

### 3. Sketch and extrude

To create a simple body from a sketch:

1. Create a sketch plane.
2. Select that sketch plane in the scene panel.
3. Click `Sketch Rectangle`.
4. Click `Extrude`.

### 4. Edit scene nodes

Select a node in the scene panel, then use the properties panel to:

- rename it
- move it in `+X`, `-X`, `+Z`, or `-Z`
- remove it

### 5. Undo and redo

Use the toolbar `Undo` and `Redo` buttons.

Undo/redo is tracked per user in the client history manager, which is the core interaction model this repo is exploring.

### 6. Save the room document

Click `Save` to persist the current shared document state through the server.

Saved room documents are written to:

[`apps/server/.data/rooms`](/Users/mshen0/ML%20&%20AI/Cursor-coding/3D%20model%20for%20Figma/apps/server/.data/rooms)

The server stores one JSON file per room/document id.

### 7. Test collaboration

Open a second browser tab or window with the same `room` value:

```text
http://localhost:3000?room=my-concept-review&name=Teammate
```

Both clients should see:

- the same scene document
- live presence updates
- accepted operations reflected across the room

## Available Scripts

```bash
npm run dev
npm run dev:web
npm run dev:server
npm run build
npm run typecheck
npm run test
```

## Build, Typecheck, and Test

Run the workspace checks:

```bash
npm run typecheck
npm run test
```

Build all packages and apps:

```bash
npm run build
```

## Current Limitations

- no authentication or permissions yet
- no hosted database or object storage yet
- no comments, versions, or review mode yet
- no advanced transform gizmo yet
- no full parametric history tree or CAD constraints

This is currently a concept-stage collaborative modeling foundation, not a production-ready CAD platform.

## Publishing This Repo To GitHub

The project is already initialized as a local git repository, but no GitHub remote is configured in this environment.

From your machine, the normal publish flow is:

```bash
git add .
git commit -m "Initial project scaffold"
git remote add origin git@github.com:<your-user-or-org>/<repo-name>.git
git push -u origin main
```

If you prefer HTTPS:

```bash
git remote add origin https://github.com/<your-user-or-org>/<repo-name>.git
git push -u origin main
```

## Suggested GitHub Repository Name

`figma-for-3d`

Other reasonable names:

- `collaborative-3d-design-tool`
- `industrial-concept-modeler`
- `designer-collab-cad`

## Vision

This repo is building toward a shared scene-document architecture where multiple designers can explore form together in real time, with semantic edits, predictable collaboration, and trustworthy per-user undo/redo.
