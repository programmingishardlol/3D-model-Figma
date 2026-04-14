import { createId } from "@figma-3d/shared";
import type {
  DesignDocument,
  Feature,
  PreparedCommand,
  PrimitiveDefinition,
  SceneNode,
  Sketch,
  SketchCurve,
  Transform3D,
  UserCommand
} from "@figma-3d/shared";
import { defaultTransform, createPrimitiveNode } from "./document";

function opMeta(document: DesignDocument, actorId: string, transactionId?: string) {
  return {
    id: createId("op"),
    documentId: document.id,
    actorId,
    transactionId: transactionId ?? createId("txn"),
    baseRevision: document.revision,
    timestamp: new Date().toISOString()
  };
}

function mergeTransform(current: Transform3D, next: Partial<Transform3D>): Transform3D {
  return {
    position: next.position ?? current.position,
    rotation: next.rotation ?? current.rotation,
    scale: next.scale ?? current.scale
  };
}

function primitiveDefinition(kind: "box" | "cylinder"): PrimitiveDefinition {
  return kind === "box"
    ? { kind: "box", width: 1.4, height: 1, depth: 1.2 }
    : { kind: "cylinder", radius: 0.55, height: 1.5 };
}

export function prepareCommand(document: DesignDocument, command: UserCommand): PreparedCommand {
  switch (command.kind) {
    case "primitive.create": {
      const node = createPrimitiveNode(
        command.nodeId,
        command.name,
        primitiveDefinition(command.primitive),
        command.transform ?? defaultTransform([0, 0.5, 0])
      );
      const createMeta = opMeta(document, command.actorId, command.transactionId);

      return {
        command,
        forwardOps: [
          {
            ...createMeta,
            kind: "node.create",
            node,
            parentId: command.parentId,
            index: document.scene.rootIds.length
          }
        ],
        inverseOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.delete",
            nodeId: command.nodeId
          }
        ]
      };
    }

    case "node.rename": {
      const node = document.scene.nodes[command.nodeId];
      if (!node) {
        throw new Error(`Cannot rename missing node ${command.nodeId}`);
      }

      return {
        command,
        forwardOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.rename",
            nodeId: command.nodeId,
            name: command.name
          }
        ],
        inverseOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.rename",
            nodeId: command.nodeId,
            name: node.name
          }
        ]
      };
    }

    case "node.transform": {
      const node = document.scene.nodes[command.nodeId];
      if (!node) {
        throw new Error(`Cannot transform missing node ${command.nodeId}`);
      }

      return {
        command,
        forwardOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.transform.set",
            nodeId: command.nodeId,
            next: command.next
          }
        ],
        inverseOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.transform.set",
            nodeId: command.nodeId,
            next: {
              position: node.transform.position,
              rotation: node.transform.rotation,
              scale: node.transform.scale
            }
          }
        ]
      };
    }

    case "node.delete": {
      const node = document.scene.nodes[command.nodeId];
      if (!node) {
        throw new Error(`Cannot delete missing node ${command.nodeId}`);
      }

      const siblingIds = node.parentId
        ? document.scene.nodes[node.parentId]?.childIds ?? []
        : document.scene.rootIds;
      const index = siblingIds.indexOf(command.nodeId);

      return {
        command,
        forwardOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.delete",
            nodeId: command.nodeId
          }
        ],
        inverseOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.create",
            node: structuredClone(node),
            parentId: node.parentId,
            index: index >= 0 ? index : 0
          }
        ]
      };
    }

    case "sketchPlane.create": {
      const sketch: Sketch = {
        id: command.sketchId,
        name: `${command.name} Sketch`,
        curveIds: [],
        curves: {},
        plane: {
          origin: command.origin,
          normal: command.normal
        }
      };

      const node: SceneNode = {
        id: command.nodeId,
        kind: "sketchPlane",
        name: command.name,
        parentId: null,
        childIds: [],
        transform: defaultTransform(command.origin),
        visible: true,
        lockedByUserId: null,
        sketchId: command.sketchId,
        plane: sketch.plane
      };

      return {
        command,
        forwardOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "sketch.create",
            sketch
          },
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.create",
            node,
            parentId: null,
            index: document.scene.rootIds.length
          }
        ],
        inverseOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.delete",
            nodeId: command.nodeId
          },
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "sketch.delete",
            sketchId: command.sketchId
          }
        ]
      };
    }

    case "sketch.curve.addRectangle":
    case "sketch.curve.addCircle":
    case "sketch.curve.addLine": {
      const sketch = document.sketches[command.sketchId];
      if (!sketch) {
        throw new Error(`Cannot edit missing sketch ${command.sketchId}`);
      }

      let curve: SketchCurve;

      if (command.kind === "sketch.curve.addRectangle") {
        curve = {
          id: command.curveId,
          kind: "rectangle",
          origin: command.origin,
          width: command.width,
          height: command.height
        };
      } else if (command.kind === "sketch.curve.addCircle") {
        curve = {
          id: command.curveId,
          kind: "circle",
          center: command.center,
          radius: command.radius
        };
      } else {
        curve = {
          id: command.curveId,
          kind: "line",
          start: command.start,
          end: command.end
        };
      }

      return {
        command,
        forwardOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "sketch.curve.add",
            sketchId: sketch.id,
            curve
          }
        ],
        inverseOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "sketch.curve.remove",
            sketchId: sketch.id,
            curveId: curve.id
          }
        ]
      };
    }

    case "feature.extrude": {
      const sketch = document.sketches[command.sketchId];
      if (!sketch) {
        throw new Error(`Cannot extrude missing sketch ${command.sketchId}`);
      }

      const feature: Feature = {
        id: command.featureId,
        kind: "extrude",
        name: command.name,
        sketchId: sketch.id,
        distance: command.distance,
        resultNodeId: command.bodyNodeId
      };

      const bodyNode: SceneNode = {
        id: command.bodyNodeId,
        kind: "body",
        name: command.name,
        parentId: null,
        childIds: [],
        transform: defaultTransform([0, command.distance / 2, -2]),
        visible: true,
        lockedByUserId: null,
        sourceFeatureId: feature.id,
        bodyState: "solid"
      };

      return {
        command,
        forwardOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "feature.create",
            feature
          },
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.create",
            node: bodyNode,
            parentId: null,
            index: document.scene.rootIds.length
          }
        ],
        inverseOps: [
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "node.delete",
            nodeId: bodyNode.id
          },
          {
            ...opMeta(document, command.actorId, command.transactionId),
            kind: "feature.delete",
            featureId: feature.id
          }
        ]
      };
    }

    case "history.undo":
    case "history.redo":
      return {
        command,
        forwardOps: [],
        inverseOps: []
      };
  }
}

export function applyTransform(node: SceneNode, next: Partial<Transform3D>): SceneNode {
  return {
    ...node,
    transform: mergeTransform(node.transform, next)
  };
}
