import type {
  BodyNode,
  DesignDocument,
  PrimitiveNode,
  Sketch,
  SketchCurve,
  Transform3D
} from "@figma-3d/shared";

export type DisplayMesh =
  | {
      id: string;
      sourceNodeId: string;
      kind: "box" | "extrusion";
      size: [number, number, number];
      transform: Transform3D;
      color: string;
    }
  | {
      id: string;
      sourceNodeId: string;
      kind: "cylinder";
      radius: number;
      height: number;
      transform: Transform3D;
      color: string;
    };

function sketchBounds(sketch: Sketch) {
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  let initialized = false;

  const includePoint = (x: number, y: number) => {
    if (!initialized) {
      minX = maxX = x;
      minY = maxY = y;
      initialized = true;
      return;
    }

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };

  const visitCurve = (curve: SketchCurve) => {
    switch (curve.kind) {
      case "rectangle":
        includePoint(curve.origin[0], curve.origin[1]);
        includePoint(curve.origin[0] + curve.width, curve.origin[1] + curve.height);
        return;
      case "circle":
        includePoint(curve.center[0] - curve.radius, curve.center[1] - curve.radius);
        includePoint(curve.center[0] + curve.radius, curve.center[1] + curve.radius);
        return;
      case "line":
        includePoint(curve.start[0], curve.start[1]);
        includePoint(curve.end[0], curve.end[1]);
        return;
    }
  };

  sketch.curveIds.forEach((curveId) => {
    const curve = sketch.curves[curveId];
    if (curve) {
      visitCurve(curve);
    }
  });

  if (!initialized) {
    return { width: 1, height: 1 };
  }

  return {
    width: Math.max(maxX - minX, 0.2),
    height: Math.max(maxY - minY, 0.2)
  };
}

function primitiveMesh(node: PrimitiveNode): DisplayMesh {
  if (node.primitive.kind === "box") {
    return {
      id: `mesh_${node.id}`,
      sourceNodeId: node.id,
      kind: "box",
      size: [node.primitive.width, node.primitive.height, node.primitive.depth],
      transform: node.transform,
      color: "#c05f34"
    };
  }

  return {
    id: `mesh_${node.id}`,
    sourceNodeId: node.id,
    kind: "cylinder",
    radius: node.primitive.radius,
    height: node.primitive.height,
    transform: node.transform,
    color: "#1d6c74"
  };
}

function extrudeMesh(document: DesignDocument, node: BodyNode): DisplayMesh | null {
  const feature = document.features[node.sourceFeatureId];
  if (!feature || feature.kind !== "extrude") {
    return null;
  }

  const sketch = document.sketches[feature.sketchId];
  const bounds = sketch ? sketchBounds(sketch) : { width: 1, height: 1 };

  return {
    id: `mesh_${node.id}`,
    sourceNodeId: node.id,
    kind: "extrusion",
    size: [bounds.width, feature.distance, bounds.height],
    transform: node.transform,
    color: "#7f8f52"
  };
}

export function deriveDisplayMeshes(document: DesignDocument): DisplayMesh[] {
  return document.scene.rootIds
    .map((id) => document.scene.nodes[id])
    .flatMap((node) => {
      if (!node || !node.visible) {
        return [];
      }

      if (node.kind === "primitive") {
        return [primitiveMesh(node)];
      }

      if (node.kind === "body") {
        const mesh = extrudeMesh(document, node);
        return mesh ? [mesh] : [];
      }

      return [];
    });
}
