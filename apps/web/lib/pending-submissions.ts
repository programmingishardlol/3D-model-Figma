import { applyOperations } from "@figma-3d/collab";
import type { DesignDocument, DocumentOperation } from "@figma-3d/shared";

export type PendingSubmission = {
  transactionId: string;
  operations: DocumentOperation[];
};

export type RebasedSubmission = {
  transactionId: string;
  operations: DocumentOperation[];
  baseRevision: number;
  rebasedRevision: number;
};

export function queuePendingSubmission(
  queue: PendingSubmission[],
  submission: PendingSubmission
): PendingSubmission[] {
  return [
    ...queue.filter((entry) => entry.transactionId !== submission.transactionId),
    submission
  ];
}

export function removePendingSubmission(
  queue: PendingSubmission[],
  transactionId: string
): PendingSubmission[] {
  return queue.filter((entry) => entry.transactionId !== transactionId);
}

export function replayPendingSubmissions(
  document: DesignDocument,
  submissions: PendingSubmission[]
): {
  document: DesignDocument;
  submissions: RebasedSubmission[];
} {
  let nextDocument = document;
  const rebasedSubmissions: RebasedSubmission[] = [];

  for (const submission of submissions) {
    const baseRevision = nextDocument.revision;
    nextDocument = applyOperations(nextDocument, submission.operations);
    rebasedSubmissions.push({
      transactionId: submission.transactionId,
      operations: submission.operations,
      baseRevision,
      rebasedRevision: nextDocument.revision
    });
  }

  return {
    document: nextDocument,
    submissions: rebasedSubmissions
  };
}
