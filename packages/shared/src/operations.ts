import type { DesignDocument, Feature, SceneNode, Sketch, SketchCurve, Transform3D } from "./document";
import type { DocumentId, FeatureId, NodeId, OperationId, SketchId, TransactionId, UserId } from "./ids";

export type OperationBase = {
  id: OperationId;
  documentId: DocumentId;
  actorId: UserId;
  transactionId: TransactionId;
  baseRevision: number;
  timestamp: string;
};

export type NodeCreateOperation = OperationBase & {
  kind: "node.create";
  node: SceneNode;
  parentId: NodeId | null;
  index: number;
};

export type NodeDeleteOperation = OperationBase & {
  kind: "node.delete";
  nodeId: NodeId;
};

export type NodeRenameOperation = OperationBase & {
  kind: "node.rename";
  nodeId: NodeId;
  name: string;
};

export type NodeTransformSetOperation = OperationBase & {
  kind: "node.transform.set";
  nodeId: NodeId;
  next: Partial<Transform3D>;
};

export type SketchCreateOperation = OperationBase & {
  kind: "sketch.create";
  sketch: Sketch;
};

export type SketchDeleteOperation = OperationBase & {
  kind: "sketch.delete";
  sketchId: SketchId;
};

export type SketchCurveAddOperation = OperationBase & {
  kind: "sketch.curve.add";
  sketchId: SketchId;
  curve: SketchCurve;
};

export type SketchCurveRemoveOperation = OperationBase & {
  kind: "sketch.curve.remove";
  sketchId: SketchId;
  curveId: string;
};

export type FeatureCreateOperation = OperationBase & {
  kind: "feature.create";
  feature: Feature;
};

export type FeatureDeleteOperation = OperationBase & {
  kind: "feature.delete";
  featureId: FeatureId;
};

export type DocumentOperation =
  | NodeCreateOperation
  | NodeDeleteOperation
  | NodeRenameOperation
  | NodeTransformSetOperation
  | SketchCreateOperation
  | SketchDeleteOperation
  | SketchCurveAddOperation
  | SketchCurveRemoveOperation
  | FeatureCreateOperation
  | FeatureDeleteOperation;

export type OperationBatch = {
  document: DesignDocument;
  operations: DocumentOperation[];
};
