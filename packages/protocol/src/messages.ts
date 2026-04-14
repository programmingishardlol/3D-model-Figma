import type { DesignDocument, DocumentOperation } from "@figma-3d/shared";

export type PresenceState = {
  documentId: string;
  userId: string;
  name: string;
  color: string;
  selectedNodeIds: string[];
  activeTool: string;
  cursor?: {
    x: number;
    y: number;
  };
  updatedAt: string;
};

export type JoinRoomMessage = {
  type: "join-room";
  documentId: string;
  userId: string;
  name: string;
  color: string;
  knownRevision?: number;
};

export type SubmitOperationsMessage = {
  type: "submit-ops";
  documentId: string;
  actorId: string;
  baseRevision: number;
  operations: DocumentOperation[];
};

export type SaveDocumentMessage = {
  type: "save-document";
  documentId: string;
  actorId: string;
  document: DesignDocument;
};

export type PresenceUpdateMessage = {
  type: "presence.update";
  documentId: string;
  presence: PresenceState;
};

export type RequestResyncMessage = {
  type: "request-resync";
  documentId: string;
};

export type ClientMessage =
  | JoinRoomMessage
  | SubmitOperationsMessage
  | SaveDocumentMessage
  | PresenceUpdateMessage
  | RequestResyncMessage;

export type SnapshotMessage = {
  type: "snapshot";
  documentId: string;
  revision: number;
  document: DesignDocument;
};

export type AcceptedOperationsMessage = {
  type: "ops-accepted";
  documentId: string;
  revision: number;
  operations: DocumentOperation[];
};

export type RejectedOperationsMessage = {
  type: "ops-rejected";
  documentId: string;
  reason: string;
  expectedRevision: number;
};

export type PresenceSyncMessage = {
  type: "presence.sync";
  documentId: string;
  presence: PresenceState[];
};

export type DocumentSavedMessage = {
  type: "document-saved";
  documentId: string;
  revision: number;
  savedAt: string;
};

export type ServerMessage =
  | SnapshotMessage
  | AcceptedOperationsMessage
  | RejectedOperationsMessage
  | PresenceSyncMessage
  | DocumentSavedMessage;

export function createSubmitOperationsMessage(
  documentId: string,
  actorId: string,
  baseRevision: number,
  operations: DocumentOperation[]
): SubmitOperationsMessage {
  return {
    type: "submit-ops",
    documentId,
    actorId,
    baseRevision,
    operations
  };
}

export function createAcceptedOperationsMessage(
  documentId: string,
  revision: number,
  operations: DocumentOperation[]
): AcceptedOperationsMessage {
  return {
    type: "ops-accepted",
    documentId,
    revision,
    operations
  };
}

export function createSaveDocumentMessage(
  documentId: string,
  actorId: string,
  document: DesignDocument
): SaveDocumentMessage {
  return {
    type: "save-document",
    documentId,
    actorId,
    document
  };
}

export function createRejectedOperationsMessage(
  documentId: string,
  expectedRevision: number,
  reason: string
): RejectedOperationsMessage {
  return {
    type: "ops-rejected",
    documentId,
    expectedRevision,
    reason
  };
}

export function createSnapshotMessage(document: DesignDocument): SnapshotMessage {
  return {
    type: "snapshot",
    documentId: document.id,
    revision: document.revision,
    document
  };
}

export function createPresenceSyncMessage(
  documentId: string,
  presence: PresenceState[]
): PresenceSyncMessage {
  return {
    type: "presence.sync",
    documentId,
    presence
  };
}

export function createDocumentSavedMessage(
  documentId: string,
  revision: number,
  savedAt: string
): DocumentSavedMessage {
  return {
    type: "document-saved",
    documentId,
    revision,
    savedAt
  };
}

export function isClientMessage(value: unknown): value is ClientMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const type = (value as { type?: string }).type;
  return (
    type === "join-room" ||
    type === "submit-ops" ||
    type === "save-document" ||
    type === "presence.update" ||
    type === "request-resync"
  );
}
