"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearCurrentSocket, isCurrentSocket } from "./socket-session";

import type {
  AcceptedOperationsMessage,
  DocumentSavedMessage,
  PresenceState,
  RejectedOperationsMessage,
  ServerMessage,
  SnapshotMessage
} from "@figma-3d/protocol";
import type { DesignDocument } from "@figma-3d/shared";

type UseCollabRoomArgs = {
  roomId: string;
  actorId: string;
  name: string;
  color: string;
  onSnapshot: (document: DesignDocument) => void;
  onAccepted: (message: AcceptedOperationsMessage) => void;
  onSaved: (message: DocumentSavedMessage) => void;
  onRejected: (message: RejectedOperationsMessage) => void;
  onPresence: (presence: PresenceState[]) => void;
};

type SubmitOperationsResult = {
  submitted: boolean;
  delivery: "sent" | "queued" | "failed";
  socketReadyState: number | null;
  reason?: string;
};

type SaveDocumentResult = {
  submitted: boolean;
  delivery: "sent" | "queued" | "failed";
  socketReadyState: number | null;
  reason?: string;
};

export function useCollabRoom({
  roomId,
  actorId,
  name,
  color,
  onSnapshot,
  onAccepted,
  onSaved,
  onRejected,
  onPresence
}: UseCollabRoomArgs) {
  const [status, setStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const onSnapshotRef = useRef(onSnapshot);
  const onAcceptedRef = useRef(onAccepted);
  const onSavedRef = useRef(onSaved);
  const onRejectedRef = useRef(onRejected);
  const onPresenceRef = useRef(onPresence);

  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
    onAcceptedRef.current = onAccepted;
    onSavedRef.current = onSaved;
    onRejectedRef.current = onRejected;
    onPresenceRef.current = onPresence;
  }, [onAccepted, onPresence, onRejected, onSaved, onSnapshot]);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_COLLAB_URL ?? "ws://localhost:8787";
    let disposed = false;
    let activeSocket: WebSocket | null = null;

    const connect = () => {
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }

      setStatus("connecting");
      const socket = new WebSocket(endpoint);
      activeSocket = socket;
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        if (disposed || !isCurrentSocket(socketRef.current, socket)) {
          return;
        }

        setStatus("connected");
        socket.send(
          JSON.stringify({
            type: "join-room",
            documentId: roomId,
            userId: actorId,
            name,
            color,
            knownRevision: 0
          })
        );
        for (const pendingMessage of pendingMessagesRef.current) {
          socket.send(pendingMessage);
        }
        pendingMessagesRef.current = [];
      });

      socket.addEventListener("message", (event) => {
        if (!isCurrentSocket(socketRef.current, socket)) {
          return;
        }

        const message = JSON.parse(event.data) as ServerMessage;

        if (message.type === "snapshot") {
          onSnapshotRef.current((message as SnapshotMessage).document);
          return;
        }

        if (message.type === "ops-accepted") {
          onAcceptedRef.current(message as AcceptedOperationsMessage);
          return;
        }

        if (message.type === "document-saved") {
          onSavedRef.current(message as DocumentSavedMessage);
          return;
        }

        if (message.type === "ops-rejected") {
          onRejectedRef.current(message as RejectedOperationsMessage);
          return;
        }

        if (message.type === "presence.sync") {
          onPresenceRef.current(message.presence);
        }
      });

      socket.addEventListener("error", () => {
        if (!isCurrentSocket(socketRef.current, socket)) {
          return;
        }

        setStatus("offline");
      });

      socket.addEventListener("close", () => {
        const closeResult = clearCurrentSocket(socketRef.current, socket);
        socketRef.current = closeResult.nextSocket;

        if (disposed || !closeResult.cleared) {
          return;
        }

        setStatus("offline");
        reconnectRef.current = window.setTimeout(connect, 1200);
      });
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
      }
      activeSocket?.close();
    };
  }, [actorId, color, name, roomId]);

  const submitOperations = useCallback(
    (
      documentId: string,
      baseRevision: number,
      operations: AcceptedOperationsMessage["operations"]
    ): SubmitOperationsResult => {
      const socket = socketRef.current;
      const payload = JSON.stringify({
        type: "submit-ops",
        documentId,
        actorId,
        baseRevision,
        operations
      });

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        pendingMessagesRef.current.push(payload);
        return {
          submitted: true,
          delivery: "queued",
          socketReadyState: socket?.readyState ?? null,
          reason: "socket-not-open"
        };
      }

      try {
        socket.send(payload);
        return {
          submitted: true,
          delivery: "sent",
          socketReadyState: socket.readyState
        };
      } catch (error) {
        return {
          submitted: false,
          delivery: "failed",
          socketReadyState: socket.readyState,
          reason: error instanceof Error ? error.message : "unknown-send-error"
        };
      }
    },
    [actorId]
  );

  const saveDocument = useCallback(
    (document: DesignDocument): SaveDocumentResult => {
      const socket = socketRef.current;
      const payload = JSON.stringify({
        type: "save-document",
        documentId: document.id,
        actorId,
        document
      });

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        pendingMessagesRef.current.push(payload);
        return {
          submitted: true,
          delivery: "queued",
          socketReadyState: socket?.readyState ?? null,
          reason: "socket-not-open"
        };
      }

      try {
        socket.send(payload);
        return {
          submitted: true,
          delivery: "sent",
          socketReadyState: socket.readyState
        };
      } catch (error) {
        return {
          submitted: false,
          delivery: "failed",
          socketReadyState: socket.readyState,
          reason: error instanceof Error ? error.message : "unknown-send-error"
        };
      }
    },
    [actorId]
  );

  const sendPresence = useCallback(
    (presence: PresenceState) => {
      const socket = socketRef.current;
      const payload = JSON.stringify({
        type: "presence.update",
        documentId: roomId,
        presence
      });

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        pendingMessagesRef.current = pendingMessagesRef.current.filter(
          (message) => !message.includes("\"type\":\"presence.update\"")
        );
        pendingMessagesRef.current.push(payload);
        return;
      }

      socket.send(payload);
    },
    [roomId]
  );

  const requestResync = useCallback(() => {
    const socket = socketRef.current;
    const payload = JSON.stringify({
      type: "request-resync",
      documentId: roomId
    });

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      pendingMessagesRef.current.push(payload);
      return;
    }

    socket.send(payload);
  }, [roomId]);

  return {
    status,
    submitOperations,
    saveDocument,
    sendPresence,
    requestResync
  };
}
