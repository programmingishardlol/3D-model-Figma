import { createId } from "@figma-3d/shared";
import type { PreparedCommand, TransactionId } from "@figma-3d/shared";

type HistoryEntry = PreparedCommand;

type OpenGroup = {
  actorId: string;
  label: string;
  transactionId: TransactionId;
  entries: PreparedCommand[];
};

function invertEntry(entry: PreparedCommand, kind: "history.undo" | "history.redo"): PreparedCommand {
  return {
    command: {
      id: createId("cmd"),
      kind,
      actorId: entry.command.actorId,
      label: kind === "history.undo" ? `Undo ${entry.command.label}` : `Redo ${entry.command.label}`,
      timestamp: new Date().toISOString(),
      sourceCommandId: entry.command.id
    },
    forwardOps: kind === "history.undo" ? entry.inverseOps : entry.forwardOps,
    inverseOps: kind === "history.undo" ? entry.forwardOps : entry.inverseOps
  };
}

export class LocalHistoryManager {
  private readonly actorId: string;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private openGroup: OpenGroup | null = null;

  constructor(actorId: string) {
    this.actorId = actorId;
  }

  get depth() {
    return this.undoStack.length;
  }

  record(entry: PreparedCommand) {
    if (entry.command.actorId !== this.actorId || entry.forwardOps.length === 0) {
      return;
    }

    this.undoStack.push(entry);
    this.redoStack = [];
  }

  beginGroup(label: string, transactionId: TransactionId) {
    this.openGroup = {
      actorId: this.actorId,
      label,
      transactionId,
      entries: []
    };
  }

  recordWithinGroup(entry: PreparedCommand) {
    if (!this.openGroup) {
      this.record(entry);
      return;
    }

    this.openGroup.entries.push(entry);
  }

  commitGroup() {
    if (!this.openGroup || this.openGroup.entries.length === 0) {
      this.openGroup = null;
      return;
    }

    const groupedEntry: PreparedCommand = {
      command: {
        id: createId("cmd"),
        kind: "node.transform",
        actorId: this.actorId,
        label: this.openGroup.label,
        timestamp: new Date().toISOString(),
        transactionId: this.openGroup.transactionId,
        nodeId: this.openGroup.entries[0].command.kind === "node.transform"
          ? this.openGroup.entries[0].command.nodeId
          : "grouped",
        next: {}
      },
      forwardOps: this.openGroup.entries.flatMap((entry) => entry.forwardOps),
      inverseOps: this.openGroup.entries
        .slice()
        .reverse()
        .flatMap((entry) => entry.inverseOps)
    };

    this.record(groupedEntry);
    this.openGroup = null;
  }

  undo(): PreparedCommand | null {
    const entry = this.undoStack.pop();
    if (!entry) {
      return null;
    }

    this.redoStack.push(entry);
    return invertEntry(entry, "history.undo");
  }

  redo(): PreparedCommand | null {
    const entry = this.redoStack.pop();
    if (!entry) {
      return null;
    }

    this.undoStack.push(entry);
    return invertEntry(entry, "history.redo");
  }
}
