import { createId } from "@figma-3d/shared";
import type {
  DesignDocument,
  PrimitiveDefinition,
  PrimitiveNode,
  SceneNode,
  Transform3D,
  Vec3
} from "@figma-3d/shared";

export function defaultTransform(position: Vec3 = [0, 0, 0]): Transform3D {
  return {
    position,
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  };
}

export function createEmptyDocument(
  name: string,
  createdBy: string,
  documentId: string = createId("doc")
): DesignDocument {
  const now = new Date().toISOString();

  return {
    id: documentId,
    name,
    revision: 0,
    scene: {
      rootIds: [],
      nodes: {}
    },
    sketches: {},
    features: {},
    metadata: {
      createdBy,
      createdAt: now,
      updatedAt: now
    }
  };
}

export function createPrimitiveNode(
  nodeId: string,
  name: string,
  primitive: PrimitiveDefinition,
  transform: Transform3D
): PrimitiveNode {
  return {
    id: nodeId,
    kind: "primitive",
    name,
    parentId: null,
    childIds: [],
    transform,
    visible: true,
    lockedByUserId: null,
    primitive
  };
}

export function serializeDocument(document: DesignDocument): string {
  return JSON.stringify(document, null, 2);
}

export function deserializeDocument(serialized: string): DesignDocument {
  return JSON.parse(serialized) as DesignDocument;
}

export function cloneNode<TNode extends SceneNode>(node: TNode): TNode {
  return structuredClone(node);
}
