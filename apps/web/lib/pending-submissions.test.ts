import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyDocument, defaultTransform, prepareCommand } from "@figma-3d/3d-core";
import {
  queuePendingSubmission,
  removePendingSubmission,
  replayPendingSubmissions
} from "./pending-submissions";

test("queuePendingSubmission replaces an existing transaction batch", () => {
  const queued = queuePendingSubmission(
    [
      {
        transactionId: "txn_1",
        operations: []
      }
    ],
    {
      transactionId: "txn_1",
      operations: []
    }
  );

  assert.equal(queued.length, 1);
  assert.equal(queued[0]?.transactionId, "txn_1");
});

test("removePendingSubmission drops only the matching batch", () => {
  const remaining = removePendingSubmission(
    [
      {
        transactionId: "txn_1",
        operations: []
      },
      {
        transactionId: "txn_2",
        operations: []
      }
    ],
    "txn_1"
  );

  assert.deepEqual(
    remaining.map((submission) => submission.transactionId),
    ["txn_2"]
  );
});

test("replayPendingSubmissions rebases pending batches onto a fresh snapshot", () => {
  const actorId = "user_local";
  const snapshot = createEmptyDocument("Replay Test", actorId, "doc_replay");

  const createPrepared = prepareCommand(snapshot, {
    id: "cmd_create",
    kind: "primitive.create",
    actorId,
    label: "Create Box",
    timestamp: new Date().toISOString(),
    transactionId: "txn_create",
    nodeId: "node_box",
    name: "Box",
    primitive: "box",
    parentId: null,
    transform: defaultTransform([0, 0.5, 0])
  });

  const renamePrepared = prepareCommand(
    {
      ...snapshot,
      revision: 1,
      scene: {
        rootIds: ["node_box"],
        nodes: {
          node_box: {
            id: "node_box",
            kind: "primitive",
            name: "Box",
            parentId: null,
            childIds: [],
            transform: defaultTransform([0, 0.5, 0]),
            visible: true,
            lockedByUserId: null,
            primitive: {
              kind: "box",
              width: 1.4,
              height: 1,
              depth: 1.2
            }
          }
        }
      }
    },
    {
      id: "cmd_rename",
      kind: "node.rename",
      actorId,
      label: "Rename Box",
      timestamp: new Date().toISOString(),
      transactionId: "txn_rename",
      nodeId: "node_box",
      name: "Renamed Box"
    }
  );

  const replayed = replayPendingSubmissions(snapshot, [
    {
      transactionId: "txn_create",
      operations: createPrepared.forwardOps
    },
    {
      transactionId: "txn_rename",
      operations: renamePrepared.forwardOps
    }
  ]);

  assert.equal(replayed.submissions[0]?.baseRevision, 0);
  assert.equal(replayed.submissions[0]?.rebasedRevision, 1);
  assert.equal(replayed.submissions[1]?.baseRevision, 1);
  assert.equal(replayed.submissions[1]?.rebasedRevision, 2);
  assert.equal(replayed.document.revision, 2);
  assert.equal(replayed.document.scene.nodes.node_box?.name, "Renamed Box");
});
