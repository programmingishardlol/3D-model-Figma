import type { Transform3D, Vec2, Vec3 } from "./document";
import type {
  CommandId,
  CurveId,
  FeatureId,
  NodeId,
  SketchId,
  TransactionId,
  UserId
} from "./ids";
import type { DocumentOperation } from "./operations";

export type CommandBase = {
  id: CommandId;
  actorId: UserId;
  label: string;
  timestamp: string;
  transactionId?: TransactionId;
};

export type CreatePrimitiveCommand = CommandBase & {
  kind: "primitive.create";
  nodeId: NodeId;
  name: string;
  primitive: "box" | "cylinder";
  parentId: NodeId | null;
  transform?: Transform3D;
};

export type RenameNodeCommand = CommandBase & {
  kind: "node.rename";
  nodeId: NodeId;
  name: string;
};

export type TransformNodeCommand = CommandBase & {
  kind: "node.transform";
  nodeId: NodeId;
  next: Partial<Transform3D>;
};

export type DeleteNodeCommand = CommandBase & {
  kind: "node.delete";
  nodeId: NodeId;
};

export type CreateSketchPlaneCommand = CommandBase & {
  kind: "sketchPlane.create";
  nodeId: NodeId;
  sketchId: SketchId;
  name: string;
  origin: Vec3;
  normal: Vec3;
};

export type AddRectangleCurveCommand = CommandBase & {
  kind: "sketch.curve.addRectangle";
  sketchId: SketchId;
  curveId: CurveId;
  origin: Vec2;
  width: number;
  height: number;
};

export type AddCircleCurveCommand = CommandBase & {
  kind: "sketch.curve.addCircle";
  sketchId: SketchId;
  curveId: CurveId;
  center: Vec2;
  radius: number;
};

export type AddLineCurveCommand = CommandBase & {
  kind: "sketch.curve.addLine";
  sketchId: SketchId;
  curveId: CurveId;
  start: Vec2;
  end: Vec2;
};

export type ExtrudeFeatureCommand = CommandBase & {
  kind: "feature.extrude";
  featureId: FeatureId;
  bodyNodeId: NodeId;
  sketchId: SketchId;
  name: string;
  distance: number;
};

export type HistoryUndoCommand = CommandBase & {
  kind: "history.undo";
  sourceCommandId: CommandId;
};

export type HistoryRedoCommand = CommandBase & {
  kind: "history.redo";
  sourceCommandId: CommandId;
};

export type UserCommand =
  | CreatePrimitiveCommand
  | RenameNodeCommand
  | TransformNodeCommand
  | DeleteNodeCommand
  | CreateSketchPlaneCommand
  | AddRectangleCurveCommand
  | AddCircleCurveCommand
  | AddLineCurveCommand
  | ExtrudeFeatureCommand
  | HistoryUndoCommand
  | HistoryRedoCommand;

export type PreparedCommand = {
  command: UserCommand;
  forwardOps: DocumentOperation[];
  inverseOps: DocumentOperation[];
};
