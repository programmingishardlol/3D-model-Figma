import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyDocument, defaultTransform, prepareCommand } from "@figma-3d/3d-core";
import { applyOperations } from "./apply-operations";

test("primitive creation applies through the operation pipeline", () => {
  const document = createEmptyDocument("Collab Test", "user_local", "doc_collab");

  const prepared = prepareCommand(document, {
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

  const nextDocument = applyOperations(document, prepared.forwardOps);
  const node = nextDocument.scene.nodes.node_box;

  assert.ok(node);
  assert.equal(node.kind, "primitive");
  assert.equal(nextDocument.revision, 1);
});
