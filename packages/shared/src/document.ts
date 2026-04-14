import type { DocumentId, FeatureId, NodeId, SketchId, UserId } from "./ids";

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export type Transform3D = {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};

export type PrimitiveKind = "box" | "cylinder";

export type PrimitiveDefinition =
  | {
      kind: "box";
      width: number;
      height: number;
      depth: number;
    }
  | {
      kind: "cylinder";
      radius: number;
      height: number;
    };

export type SceneNodeBase = {
  id: NodeId;
  name: string;
  parentId: NodeId | null;
  childIds: NodeId[];
  transform: Transform3D;
  visible: boolean;
  lockedByUserId: UserId | null;
};

export type GroupNode = SceneNodeBase & {
  kind: "group";
};

export type PrimitiveNode = SceneNodeBase & {
  kind: "primitive";
  primitive: PrimitiveDefinition;
};

export type SketchPlaneNode = SceneNodeBase & {
  kind: "sketchPlane";
  sketchId: SketchId;
  plane: {
    origin: Vec3;
    normal: Vec3;
  };
};

export type BodyNode = SceneNodeBase & {
  kind: "body";
  sourceFeatureId: FeatureId;
  bodyState: "pending" | "solid";
};

export type SceneNode = GroupNode | PrimitiveNode | SketchPlaneNode | BodyNode;

export type SketchCurveLine = {
  id: string;
  kind: "line";
  start: Vec2;
  end: Vec2;
};

export type SketchCurveRectangle = {
  id: string;
  kind: "rectangle";
  origin: Vec2;
  width: number;
  height: number;
};

export type SketchCurveCircle = {
  id: string;
  kind: "circle";
  center: Vec2;
  radius: number;
};

export type SketchCurve = SketchCurveLine | SketchCurveRectangle | SketchCurveCircle;

export type Sketch = {
  id: SketchId;
  name: string;
  curveIds: string[];
  curves: Record<string, SketchCurve>;
  plane: {
    origin: Vec3;
    normal: Vec3;
  };
};

export type ExtrudeFeature = {
  id: FeatureId;
  kind: "extrude";
  name: string;
  sketchId: SketchId;
  distance: number;
  resultNodeId: NodeId;
};

export type Feature = ExtrudeFeature;

export type DesignDocument = {
  id: DocumentId;
  name: string;
  revision: number;
  scene: {
    rootIds: NodeId[];
    nodes: Record<NodeId, SceneNode>;
  };
  sketches: Record<SketchId, Sketch>;
  features: Record<FeatureId, Feature>;
  metadata: {
    createdBy: UserId;
    createdAt: string;
    updatedAt: string;
  };
};
