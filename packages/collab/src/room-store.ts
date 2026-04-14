import {
  createAcceptedOperationsMessage,
  createRejectedOperationsMessage,
  createSnapshotMessage,
  type SnapshotMessage
} from "@figma-3d/protocol";
import type { DesignDocument, DocumentOperation } from "@figma-3d/shared";
import { applyOperations } from "./apply-operations";

type RoomJoinArgs = {
  userId: string;
  name: string;
  color: string;
  knownRevision?: number;
};

type SubmitArgs = {
  actorId: string;
  baseRevision: number;
  operations: DocumentOperation[];
};

type InMemoryRoomOptions = {
  onDocumentChanged?: (document: DesignDocument) => void;
};

export class InMemoryRoom {
  private document: DesignDocument;
  private readonly onDocumentChanged?: (document: DesignDocument) => void;

  constructor(initialDocument: DesignDocument, options: InMemoryRoomOptions = {}) {
    this.document = initialDocument;
    this.onDocumentChanged = options.onDocumentChanged;
  }

  join(_args: RoomJoinArgs): SnapshotMessage {
    return createSnapshotMessage(this.document);
  }

  snapshotMessage(): SnapshotMessage {
    return createSnapshotMessage(this.document);
  }

  replaceDocument(document: DesignDocument) {
    this.document = structuredClone(document);
    this.onDocumentChanged?.(this.document);
  }

  submitOperations(args: SubmitArgs) {
    if (args.baseRevision !== this.document.revision) {
      return {
        ok: false as const,
        rejectedMessage: createRejectedOperationsMessage(
          this.document.id,
          this.document.revision,
          `Revision mismatch for actor ${args.actorId}`
        )
      };
    }

    this.document = applyOperations(this.document, args.operations);
    this.onDocumentChanged?.(this.document);

    return {
      ok: true as const,
      acceptedMessage: createAcceptedOperationsMessage(
        this.document.id,
        this.document.revision,
        args.operations
      )
    };
  }
}

export class InMemoryRoomStore {
  private rooms = new Map<string, InMemoryRoom>();
  private readonly createDocument: (documentId: string, createdBy: string) => DesignDocument;
  private readonly loadDocument?: (documentId: string) => DesignDocument | null;
  private readonly saveDocument?: (document: DesignDocument) => void;

  constructor(
    createDocument: (documentId: string, createdBy: string) => DesignDocument,
    options: {
      loadDocument?: (documentId: string) => DesignDocument | null;
      saveDocument?: (document: DesignDocument) => void;
    } = {}
  ) {
    this.createDocument = createDocument;
    this.loadDocument = options.loadDocument;
    this.saveDocument = options.saveDocument;
  }

  getOrCreate(documentId: string, createdBy: string): InMemoryRoom {
    const existing = this.rooms.get(documentId);
    if (existing) {
      return existing;
    }

    const initialDocument =
      this.loadDocument?.(documentId) ?? this.createDocument(documentId, createdBy);
    const room = new InMemoryRoom(initialDocument, {
      onDocumentChanged: this.saveDocument
    });
    this.rooms.set(documentId, room);
    return room;
  }

  replaceDocument(documentId: string, createdBy: string, document: DesignDocument): InMemoryRoom {
    const existing = this.rooms.get(documentId);
    if (existing) {
      existing.replaceDocument(document);
      return existing;
    }

    const room = new InMemoryRoom(structuredClone(document), {
      onDocumentChanged: this.saveDocument
    });
    this.rooms.set(documentId, room);
    this.saveDocument?.(document);
    return room;
  }
}
