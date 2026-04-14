"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createEmptyDocument,
  defaultTransform,
  prepareCommand
} from "@figma-3d/3d-core";
import { applyOperations } from "@figma-3d/collab";
import { LocalHistoryManager } from "@figma-3d/history";
import {
  createSubmitOperationsMessage,
  type AcceptedOperationsMessage,
  type DocumentSavedMessage,
  type PresenceState
} from "@figma-3d/protocol";
import {
  createId,
  type DesignDocument,
  type DocumentOperation,
  type NodeId,
  type PreparedCommand,
  type UserCommand
} from "@figma-3d/shared";
import { CollabTrace } from "./collab-trace";
import { PresencePanel } from "./presence-panel";
import { PropertiesPanel } from "./properties-panel";
import { ScenePanel } from "./scene-panel";
import { Toolbar } from "./toolbar";
import { useCollabRoom } from "../lib/use-collab-room";
import {
  queuePendingSubmission,
  removePendingSubmission,
  replayPendingSubmissions,
  type PendingSubmission
} from "../lib/pending-submissions";

const ViewportShell = dynamic(
  () => import("./viewport-shell").then((module) => module.ViewportShell),
  {
    ssr: false,
    loading: () => (
      <div className="panel viewport-canvas">
        <div className="muted" style={{ padding: "24px" }}>
          Loading 3D viewport...
        </div>
      </div>
    )
  }
);

type TraceItem = {
  title: string;
  payload: unknown;
};

function transactionIdForOperations(
  operations: DocumentOperation[],
  fallbackId: string
): string {
  return operations[0]?.transactionId ?? fallbackId;
}

function nextPrimitiveCommand(
  actorId: string,
  primitive: "box" | "cylinder"
): UserCommand {
  return {
    id: createId("cmd"),
    kind: "primitive.create",
    actorId,
    label: primitive === "box" ? "Create Box" : "Create Cylinder",
    timestamp: new Date().toISOString(),
    nodeId: createId("node"),
    name: primitive === "box" ? "Box" : "Cylinder",
    primitive,
    parentId: null,
    transform:
      primitive === "box"
        ? defaultTransform([0, 0.5, 0])
        : defaultTransform([2, 0.75, 0])
  };
}

function nextSketchPlaneCommand(actorId: string): UserCommand {
  return {
    id: createId("cmd"),
    kind: "sketchPlane.create",
    actorId,
    label: "Create Sketch Plane",
    timestamp: new Date().toISOString(),
    nodeId: createId("node"),
    sketchId: createId("sketch"),
    name: "Sketch Plane",
    origin: [0, 0, -2],
    normal: [0, 1, 0]
  };
}

function appendTrace(
  currentTrace: TraceItem[],
  document: DesignDocument,
  prepared: PreparedCommand
): TraceItem[] {
  const submitMessage = createSubmitOperationsMessage(
    document.id,
    prepared.command.actorId,
    document.revision,
    prepared.forwardOps
  );

  return [
    {
      title: `client:${submitMessage.type}`,
      payload: submitMessage
    },
    ...currentTrace
  ].slice(0, 6);
}

export function EditorShell() {
  const searchParams = useSearchParams();
  const [actorId] = useState(() => createId("user"));
  const roomId = searchParams.get("room") ?? "shared-demo-room";
  const actorName = searchParams.get("name") ?? `Designer ${actorId.slice(-4)}`;
  const actorColor = searchParams.get("color") ?? "#1d6c74";
  const collabEndpoint = process.env.NEXT_PUBLIC_COLLAB_URL ?? "ws://localhost:8787";
  const [document, setDocument] = useState<DesignDocument>(() =>
    createEmptyDocument("Industrial concept study", actorId, roomId)
  );
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [presence, setPresence] = useState<PresenceState[]>([]);
  const [resyncTick, setResyncTick] = useState(0);
  const [hasReceivedInitialSnapshot, setHasReceivedInitialSnapshot] = useState(false);
  const historyRef = useRef(new LocalHistoryManager(actorId));
  const documentRef = useRef(document);
  const pendingTransactionsRef = useRef(new Set<string>());
  const pendingSubmissionsRef = useRef<PendingSubmission[]>([]);
  const shouldReplayPendingRef = useRef(false);

  const selectedNode = selectedNodeId ? document.scene.nodes[selectedNodeId] : null;

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  const appendAcceptedTrace = useCallback((title: string, payload: unknown) => {
    setTrace((currentTrace) => [{ title, payload }, ...currentTrace].slice(0, 10));
  }, []);

  const collab = useCollabRoom({
    roomId,
    actorId,
    name: actorName,
    color: actorColor,
    onSnapshot(nextDocument) {
      setHasReceivedInitialSnapshot(true);
      if (shouldReplayPendingRef.current) {
        const replayQueue = pendingSubmissionsRef.current;
        const replayed = replayPendingSubmissions(nextDocument, replayQueue);

        shouldReplayPendingRef.current = false;
        documentRef.current = replayed.document;
        setDocument(replayed.document);

        for (const submission of replayed.submissions) {
          const replayResult = collab.submitOperations(
            nextDocument.id,
            submission.baseRevision,
            submission.operations
          );

          appendAcceptedTrace("client:replay-status", {
            ...replayResult,
            documentId: nextDocument.id,
            transactionId: submission.transactionId,
            baseRevision: submission.baseRevision,
            rebasedRevision: submission.rebasedRevision,
            operationKinds: submission.operations.map((operation) => operation.kind)
          });
        }
      } else {
        setDocument((current) => {
          const next =
            nextDocument.revision < current.revision ? current : nextDocument;
          documentRef.current = next;
          return next;
        });
      }

      appendAcceptedTrace("server:snapshot", {
        documentId: nextDocument.id,
        revision: nextDocument.revision,
        rootIds: nextDocument.scene.rootIds,
        nodeCount: Object.keys(nextDocument.scene.nodes).length
      });
    },
    onAccepted(message: AcceptedOperationsMessage) {
      const transactionId = transactionIdForOperations(message.operations, message.documentId);
      const isLocal = Boolean(
        transactionId && pendingTransactionsRef.current.has(transactionId)
      );

      setDocument((current) => {
        if (isLocal && transactionId) {
          pendingTransactionsRef.current.delete(transactionId);
          pendingSubmissionsRef.current = removePendingSubmission(
            pendingSubmissionsRef.current,
            transactionId
          );
          if (message.revision <= current.revision) {
            documentRef.current = current;
            return current;
          }

          const next = {
            ...current,
            revision: message.revision
          };
          documentRef.current = next;
          return next;
        }

        if (message.revision <= current.revision) {
          documentRef.current = current;
          return current;
        }

        const next = applyOperations(current, message.operations);
        documentRef.current = next;
        return next;
      });

      appendAcceptedTrace(`server:${message.type}`, message);
    },
    onSaved(message: DocumentSavedMessage) {
      appendAcceptedTrace(`server:${message.type}`, message);
    },
    onRejected(message) {
      appendAcceptedTrace(`server:${message.type}`, message);
      shouldReplayPendingRef.current = pendingSubmissionsRef.current.length > 0;
      setResyncTick((value) => value + 1);
    },
    onPresence(nextPresence) {
      setPresence(nextPresence);
    }
  });

  useEffect(() => {
    const initialDocument = createEmptyDocument(
      "Industrial concept study",
      actorId,
      roomId
    );

    historyRef.current = new LocalHistoryManager(actorId);
    setDocument(initialDocument);
    setSelectedNodeId(null);
    setTrace([]);
    setPresence([]);
    setHasReceivedInitialSnapshot(false);
    documentRef.current = initialDocument;
    pendingTransactionsRef.current.clear();
    pendingSubmissionsRef.current = [];
    shouldReplayPendingRef.current = false;
  }, [actorId, roomId]);

  useEffect(() => {
    if (resyncTick === 0) {
      return;
    }

    collab.requestResync();
  }, [collab.requestResync, resyncTick]);

  useEffect(() => {
    if (!hasReceivedInitialSnapshot) {
      return;
    }

    collab.sendPresence({
      documentId: roomId,
      userId: actorId,
      name: actorName,
      color: actorColor,
      selectedNodeIds: selectedNodeId ? [selectedNodeId] : [],
      activeTool: "select",
      updatedAt: new Date().toISOString()
    });
  }, [
    actorColor,
    actorId,
    actorName,
    collab.sendPresence,
    hasReceivedInitialSnapshot,
    roomId,
    selectedNodeId
  ]);

  const isSyncReady = collab.status === "connected" && hasReceivedInitialSnapshot;
  const canEdit = isSyncReady;
  const syncStatusMessage = useMemo(() => {
    if (isSyncReady) {
      return null;
    }

    if (collab.status === "offline") {
      return `Collaboration server unavailable at ${collabEndpoint}. Start \`npm run dev:server\` or \`npm run dev\`. Editing stays disabled until the room snapshot can be loaded.`;
    }

    return `Connecting to ${collabEndpoint}. Editing stays disabled until the first shared room snapshot arrives.`;
  }, [collab.status, collabEndpoint, isSyncReady]);

  const executePrepared = (
    prepared: PreparedCommand,
    options?: { recordHistory?: boolean }
  ) => {
    if (!isSyncReady) {
      appendAcceptedTrace("client:edit-blocked", {
        reason: "sync-not-ready",
        connection: collab.status,
        hasReceivedInitialSnapshot
      });
      return false;
    }

    const currentDocument = documentRef.current;
    const nextDocument = applyOperations(currentDocument, prepared.forwardOps);
    const transactionId = transactionIdForOperations(
      prepared.forwardOps,
      prepared.command.id
    );

    if (options?.recordHistory !== false) {
      historyRef.current.record(prepared);
    }

    documentRef.current = nextDocument;
    setDocument(nextDocument);
    setTrace((currentTrace) => appendTrace(currentTrace, currentDocument, prepared));
    pendingTransactionsRef.current.add(transactionId);
    pendingSubmissionsRef.current = queuePendingSubmission(
      pendingSubmissionsRef.current,
      {
        transactionId,
        operations: prepared.forwardOps
      }
    );
    const submitResult = collab.submitOperations(
      currentDocument.id,
      currentDocument.revision,
      prepared.forwardOps
    );
    appendAcceptedTrace("client:submit-status", {
      ...submitResult,
      documentId: currentDocument.id,
      baseRevision: currentDocument.revision,
      operationKinds: prepared.forwardOps.map((operation) => operation.kind),
      transactionId
    });
    if (!submitResult.submitted) {
      pendingTransactionsRef.current.delete(transactionId);
      pendingSubmissionsRef.current = removePendingSubmission(
        pendingSubmissionsRef.current,
        transactionId
      );
    }

    return true;
  };

  const dispatchCommand = (command: UserCommand, options?: { recordHistory?: boolean }) => {
    const prepared = prepareCommand(documentRef.current, command);
    const executed = executePrepared(prepared, options);
    if (executed && "nodeId" in command && typeof command.nodeId === "string") {
      setSelectedNodeId(command.nodeId);
    }
  };

  const createBox = () => dispatchCommand(nextPrimitiveCommand(actorId, "box"));
  const createCylinder = () => dispatchCommand(nextPrimitiveCommand(actorId, "cylinder"));

  const createSketchPlane = () => dispatchCommand(nextSketchPlaneCommand(actorId));

  const addRectangleToSelectedSketch = () => {
    if (!selectedNode || selectedNode.kind !== "sketchPlane") {
      return;
    }

    dispatchCommand({
      id: createId("cmd"),
      kind: "sketch.curve.addRectangle",
      actorId,
      label: "Add Sketch Rectangle",
      timestamp: new Date().toISOString(),
      sketchId: selectedNode.sketchId,
      curveId: createId("curve"),
      origin: [-0.8, -0.5],
      width: 1.6,
      height: 1
    });
  };

  const extrudeSelectedSketch = () => {
    if (!selectedNode || selectedNode.kind !== "sketchPlane") {
      return;
    }

    dispatchCommand({
      id: createId("cmd"),
      kind: "feature.extrude",
      actorId,
      label: "Extrude Sketch",
      timestamp: new Date().toISOString(),
      featureId: createId("feature"),
      bodyNodeId: createId("node"),
      sketchId: selectedNode.sketchId,
      name: `${selectedNode.name} Body`,
      distance: 1.25
    });
  };

  const renameNode = (nodeId: NodeId, name: string) => {
    if (document.scene.nodes[nodeId]?.name === name) {
      return;
    }

    dispatchCommand({
      id: createId("cmd"),
      kind: "node.rename",
      actorId,
      label: "Rename Node",
      timestamp: new Date().toISOString(),
      nodeId,
      name
    });
  };

  const removeNode = (nodeId: NodeId) => {
    const node = documentRef.current.scene.nodes[nodeId];
    if (!node) {
      return;
    }

    dispatchCommand({
      id: createId("cmd"),
      kind: "node.delete",
      actorId,
      label: `Remove ${node.name}`,
      timestamp: new Date().toISOString(),
      nodeId
    });
    setSelectedNodeId((current) => (current === nodeId ? null : current));
  };

  const nudgeNode = (nodeId: NodeId, axis: "x" | "y" | "z", delta: number) => {
    const node = document.scene.nodes[nodeId];
    if (!node) {
      return;
    }

    const nextPosition = [...node.transform.position] as [number, number, number];
    const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    nextPosition[axisIndex] += delta;

    dispatchCommand({
      id: createId("cmd"),
      kind: "node.transform",
      actorId,
      label: `Move ${node.name}`,
      timestamp: new Date().toISOString(),
      nodeId,
      next: {
        position: nextPosition
      }
    });
  };

  const undo = () => {
    const prepared = historyRef.current.undo();
    if (!prepared) {
      return;
    }
    executePrepared(prepared, { recordHistory: false });
  };

  const redo = () => {
    const prepared = historyRef.current.redo();
    if (!prepared) {
      return;
    }
    executePrepared(prepared, { recordHistory: false });
  };

  const save = () => {
    const saveResult = collab.saveDocument(document);
    appendAcceptedTrace("client:save-status", {
      ...saveResult,
      documentId: document.id,
      revision: document.revision,
      rootIds: document.scene.rootIds,
      nodeCount: Object.keys(document.scene.nodes).length
    });
  };

  useEffect(() => {
    if (selectedNodeId && !document.scene.nodes[selectedNodeId]) {
      setSelectedNodeId(null);
    }
  }, [document, selectedNodeId]);

  const derivedSummary = useMemo(
    () => ({
      sketchCount: Object.keys(document.sketches).length,
      featureCount: Object.keys(document.features).length,
      historyDepth: historyRef.current.depth
    }),
    [document]
  );

  return (
    <main className="editor-shell">
      <section className="panel room-banner">
        <div>
          <strong>Live Collaboration</strong>
          <div className="muted">
            Room <code>{roomId}</code> · status <code>{collab.status}</code>
          </div>
        </div>
        <div className="muted">
          Open another tab with <code>?room={roomId}</code> to co-edit the same model.
        </div>
        {syncStatusMessage ? <div className="muted">{syncStatusMessage}</div> : null}
      </section>
      <Toolbar
        disabled={!canEdit}
        onCreateBox={createBox}
        onCreateCylinder={createCylinder}
        onCreateSketchPlane={createSketchPlane}
        onAddRectangle={addRectangleToSelectedSketch}
        onExtrude={extrudeSelectedSketch}
        onUndo={undo}
        onRedo={redo}
        onSave={save}
      />
      <div className="layout-grid">
        <div>
          <ScenePanel
            document={document}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
          <PresencePanel presence={presence} />
        </div>
        <div>
          <ViewportShell document={document} selectedNodeId={selectedNodeId} />
          <CollabTrace
            trace={[
              {
                title: "model:summary",
                payload: {
                  ...derivedSummary,
                  roomId,
                  connection: collab.status,
                  collaborators: presence.length
                }
              },
              ...trace
            ]}
          />
        </div>
        <PropertiesPanel
          document={document}
          selectedNodeId={selectedNodeId}
          disabled={!canEdit}
          onRename={renameNode}
          onNudge={nudgeNode}
          onRemove={removeNode}
        />
      </div>
    </main>
  );
}
