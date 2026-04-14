import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyDocument, defaultTransform, prepareCommand } from "@figma-3d/3d-core";
import { InMemoryRoomStore } from "./room-store";

test("room rejects operations submitted against the wrong revision", () => {
  const rooms = new InMemoryRoomStore((documentId, createdBy) =>
    createEmptyDocument("Room Test", createdBy, documentId)
  );
  const room = rooms.getOrCreate("doc_room", "user_local");

  const initialSnapshot = room.join({
    userId: "user_local",
    name: "Local",
    color: "#1d6c74"
  });

  const prepared = prepareCommand(initialSnapshot.document, {
    id: "cmd_box",
    kind: "primitive.create",
    actorId: "user_local",
    label: "Create Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_box",
    name: "Box",
    primitive: "box",
    parentId: null,
    transform: defaultTransform([0, 0.5, 0])
  });

  const accepted = room.submitOperations({
    actorId: "user_local",
    baseRevision: 0,
    operations: prepared.forwardOps
  });
  assert.equal(accepted.ok, true);

  const rejected = room.submitOperations({
    actorId: "user_local",
    baseRevision: 0,
    operations: prepared.forwardOps
  });

  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.rejectedMessage.expectedRevision, 1);
  }
});

test("room snapshot reflects accepted operations for later joiners", () => {
  const rooms = new InMemoryRoomStore((documentId, createdBy) =>
    createEmptyDocument("Room Snapshot Test", createdBy, documentId)
  );
  const room = rooms.getOrCreate("doc_snapshot", "user_local");

  const initialSnapshot = room.join({
    userId: "user_local",
    name: "Local",
    color: "#1d6c74"
  });

  const prepared = prepareCommand(initialSnapshot.document, {
    id: "cmd_box",
    kind: "primitive.create",
    actorId: "user_local",
    label: "Create Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_box",
    name: "Box",
    primitive: "box",
    parentId: null,
    transform: defaultTransform([0, 0.5, 0])
  });

  const accepted = room.submitOperations({
    actorId: "user_local",
    baseRevision: 0,
    operations: prepared.forwardOps
  });

  assert.equal(accepted.ok, true);

  const secondJoin = room.join({
    userId: "user_remote",
    name: "Remote",
    color: "#a94f3c"
  });

  assert.equal(secondJoin.document.revision, 1);
  assert.ok(secondJoin.document.scene.nodes.node_box);
  assert.equal(secondJoin.document.scene.rootIds.includes("node_box"), true);
});

test("room store reloads a persisted document for the same room id", () => {
  const persistedDocuments = new Map<string, ReturnType<typeof createEmptyDocument>>();
  const createRooms = () =>
    new InMemoryRoomStore(
      (documentId, createdBy) => createEmptyDocument("Persisted Room Test", createdBy, documentId),
      {
        loadDocument(documentId) {
          return persistedDocuments.get(documentId) ?? null;
        },
        saveDocument(document) {
          persistedDocuments.set(document.id, structuredClone(document));
        }
      }
    );

  const firstStore = createRooms();
  const firstRoom = firstStore.getOrCreate("doc_persisted", "user_local");
  const initialSnapshot = firstRoom.join({
    userId: "user_local",
    name: "Local",
    color: "#1d6c74"
  });

  const prepared = prepareCommand(initialSnapshot.document, {
    id: "cmd_box",
    kind: "primitive.create",
    actorId: "user_local",
    label: "Create Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_box",
    name: "Box",
    primitive: "box",
    parentId: null,
    transform: defaultTransform([0, 0.5, 0])
  });

  const accepted = firstRoom.submitOperations({
    actorId: "user_local",
    baseRevision: 0,
    operations: prepared.forwardOps
  });

  assert.equal(accepted.ok, true);
  assert.equal(persistedDocuments.get("doc_persisted")?.revision, 1);

  const restartedStore = createRooms();
  const restartedRoom = restartedStore.getOrCreate("doc_persisted", "user_remote");
  const restartedSnapshot = restartedRoom.join({
    userId: "user_remote",
    name: "Remote",
    color: "#a94f3c"
  });

  assert.equal(restartedSnapshot.document.revision, 1);
  assert.ok(restartedSnapshot.document.scene.nodes.node_box);
  assert.equal(restartedSnapshot.document.scene.rootIds.includes("node_box"), true);
});

test("room store replaceDocument updates the room snapshot for later joiners", () => {
  const rooms = new InMemoryRoomStore((documentId, createdBy) =>
    createEmptyDocument("Replace Snapshot Test", createdBy, documentId)
  );
  const replacement = createEmptyDocument("Saved Room", "user_local", "doc_saved");

  replacement.scene.rootIds.push("node_saved");
  replacement.scene.nodes.node_saved = {
    id: "node_saved",
    kind: "primitive",
    name: "Saved Box",
    parentId: null,
    childIds: [],
    transform: defaultTransform([0, 0.5, 0]),
    visible: true,
    lockedByUserId: null,
    primitive: {
      kind: "box",
      width: 1,
      height: 1,
      depth: 1
    }
  };
  replacement.revision = 3;

  rooms.replaceDocument("doc_saved", "user_local", replacement);
  const room = rooms.getOrCreate("doc_saved", "user_remote");
  const joined = room.join({
    userId: "user_remote",
    name: "Remote",
    color: "#999999"
  });

  assert.equal(joined.document.revision, 3);
  assert.equal(joined.document.scene.rootIds.includes("node_saved"), true);
  assert.ok(joined.document.scene.nodes.node_saved);
});
