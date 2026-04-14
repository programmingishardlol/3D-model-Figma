export type IdPrefix =
  | "doc"
  | "node"
  | "sketch"
  | "curve"
  | "feature"
  | "body"
  | "op"
  | "cmd"
  | "txn"
  | "user";

export type DocumentId = string;
export type NodeId = string;
export type SketchId = string;
export type CurveId = string;
export type FeatureId = string;
export type OperationId = string;
export type CommandId = string;
export type TransactionId = string;
export type UserId = string;

function randomPart() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8);
  }

  return Math.random().toString(36).slice(2, 10);
}

export function createId(prefix: IdPrefix): string {
  return `${prefix}_${randomPart()}`;
}
