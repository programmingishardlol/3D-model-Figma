import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyDocument, defaultTransform, prepareCommand } from "@figma-3d/3d-core";
import { LocalHistoryManager } from "./history";
import { applyOperations } from "@figma-3d/collab";

test("undo stays local to the recording actor", () => {
  const actorId = "user_local";
  const otherActorId = "user_remote";
  const history = new LocalHistoryManager(actorId);
  const document = createEmptyDocument("History Test", actorId, "doc_history");

  const localEntry = prepareCommand(document, {
    id: "cmd_local",
    kind: "primitive.create",
    actorId,
    label: "Create Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_box",
    name: "Box",
    primitive: "box",
    parentId: null,
    transform: defaultTransform([0, 0.5, 0])
  });

  const remoteEntry = prepareCommand(document, {
    id: "cmd_remote",
    kind: "primitive.create",
    actorId: otherActorId,
    label: "Create Cylinder",
    timestamp: new Date().toISOString(),
    nodeId: "node_cylinder",
    name: "Cylinder",
    primitive: "cylinder",
    parentId: null,
    transform: defaultTransform([2, 0.75, 0])
  });

  history.record(remoteEntry);
  history.record(localEntry);

  const undoEntry = history.undo();
  assert.ok(undoEntry);
  assert.equal(undoEntry.command.actorId, actorId);
  assert.equal(undoEntry.command.kind, "history.undo");
  assert.equal(undoEntry.forwardOps[0]?.kind, "node.delete");
});

test("grouped transform history collapses into one undoable batch", () => {
  const actorId = "user_local";
  const history = new LocalHistoryManager(actorId);
  let document = createEmptyDocument("Grouping Test", actorId, "doc_group");

  const createEntry = prepareCommand(document, {
    id: "cmd_create",
    kind: "primitive.create",
    actorId,
    label: "Create Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_drag",
    name: "Drag Box",
    primitive: "box",
    parentId: null,
    transform: defaultTransform([0, 0.5, 0])
  });

  document = applyOperations(document, createEntry.forwardOps);

  history.beginGroup("Drag Box", "txn_drag");

  const dragStepOne = prepareCommand(document, {
    id: "cmd_drag_1",
    kind: "node.transform",
    actorId,
    label: "Move Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_drag",
    next: { position: [0.5, 0.5, 0] }
  });
  document = applyOperations(document, dragStepOne.forwardOps);
  history.recordWithinGroup(dragStepOne);

  const dragStepTwo = prepareCommand(document, {
    id: "cmd_drag_2",
    kind: "node.transform",
    actorId,
    label: "Move Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_drag",
    next: { position: [1, 0.5, 0] }
  });
  history.recordWithinGroup(dragStepTwo);
  history.commitGroup();

  const undoEntry = history.undo();
  assert.ok(undoEntry);
  assert.equal(undoEntry.forwardOps.length, 2);
  assert.equal(undoEntry.inverseOps.length, 2);
});

test("delete command can be undone back into a node create", () => {
  const actorId = "user_local";
  const history = new LocalHistoryManager(actorId);
  let document = createEmptyDocument("Delete Test", actorId, "doc_delete");

  const createEntry = prepareCommand(document, {
    id: "cmd_create",
    kind: "primitive.create",
    actorId,
    label: "Create Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_delete_me",
    name: "Delete Me",
    primitive: "box",
    parentId: null,
    transform: defaultTransform([0, 0.5, 0])
  });
  document = applyOperations(document, createEntry.forwardOps);

  const deleteEntry = prepareCommand(document, {
    id: "cmd_delete",
    kind: "node.delete",
    actorId,
    label: "Remove Box",
    timestamp: new Date().toISOString(),
    nodeId: "node_delete_me"
  });
  history.record(deleteEntry);

  const undoEntry = history.undo();
  assert.ok(undoEntry);
  assert.equal(undoEntry.forwardOps[0]?.kind, "node.create");
  assert.equal(
    undoEntry.forwardOps[0]?.kind === "node.create"
      ? undoEntry.forwardOps[0].node.id
      : null,
    "node_delete_me"
  );
});
