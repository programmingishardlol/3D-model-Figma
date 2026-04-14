import { createEmptyDocument } from "@figma-3d/3d-core";
import { InMemoryRoomStore } from "@figma-3d/collab";
import {
  createDocumentSavedMessage,
  createPresenceSyncMessage,
  isClientMessage,
  type ClientMessage,
  type PresenceState
} from "@figma-3d/protocol";
import { createId } from "@figma-3d/shared";
import { WebSocket, WebSocketServer } from "ws";
import {
  loadPersistedDocument,
  persistedDocumentDirectory,
  savePersistedDocument
} from "./document-persistence";

const port = Number(process.env.PORT ?? 8787);
const rooms = new InMemoryRoomStore((documentId, createdBy) =>
  createEmptyDocument(`Document ${documentId}`, createdBy, documentId),
  {
    loadDocument: loadPersistedDocument,
    saveDocument: savePersistedDocument
  }
);

type ConnectedClient = {
  socket: WebSocket;
  roomId: string | null;
  userId: string | null;
  name: string;
  color: string;
  presence: PresenceState | null;
};

const clients = new Map<WebSocket, ConnectedClient>();

function broadcastToRoom(roomId: string, payload: unknown) {
  const serialized = JSON.stringify(payload);

  for (const client of clients.values()) {
    if (client.roomId === roomId && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(serialized);
    }
  }
}

function roomPresence(roomId: string): PresenceState[] {
  return Array.from(clients.values())
    .filter((client) => client.roomId === roomId && client.userId)
    .map((client) => {
      if (client.presence) {
        return {
          ...client.presence,
          documentId: roomId,
          userId: client.userId!,
          name: client.name,
          color: client.color
        };
      }

      return {
        documentId: roomId,
        userId: client.userId!,
        name: client.name,
        color: client.color,
        selectedNodeIds: [],
        activeTool: "select",
        updatedAt: new Date().toISOString()
      };
    });
}

function handleClientMessage(client: ConnectedClient, rawMessage: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawMessage);
  } catch {
    client.socket.send(
      JSON.stringify({
        type: "error",
        message: "Invalid JSON payload"
      })
    );
    return;
  }

  if (!isClientMessage(parsed)) {
    client.socket.send(
      JSON.stringify({
        type: "error",
        message: "Unknown client message shape"
      })
    );
    return;
  }

  const message = parsed as ClientMessage;

  switch (message.type) {
    case "join-room": {
      client.roomId = message.documentId;
      client.userId = message.userId;
      client.name = message.name;
      client.color = message.color;
      client.presence = {
        documentId: message.documentId,
        userId: message.userId,
        name: message.name,
        color: message.color,
        selectedNodeIds: [],
        activeTool: "select",
        updatedAt: new Date().toISOString()
      };

      const room = rooms.getOrCreate(message.documentId, message.userId);
      const snapshot = room.join({
        userId: message.userId,
        name: message.name,
        color: message.color,
        knownRevision: message.knownRevision
      });
      savePersistedDocument(snapshot.document);

      console.log(
        `[room:${message.documentId}] ${message.name} joined at revision ${snapshot.revision} with ${snapshot.document.scene.rootIds.length} root nodes`
      );
      client.socket.send(JSON.stringify(snapshot));
      broadcastToRoom(
        message.documentId,
        createPresenceSyncMessage(message.documentId, roomPresence(message.documentId))
      );
      return;
    }

    case "submit-ops": {
      if (!client.roomId) {
        console.warn(
          `[room:${message.documentId}] rejected submit from ${message.actorId}: client has not joined a room`
        );
        return;
      }

      const room = rooms.getOrCreate(client.roomId, client.userId ?? createId("user"));
      const result = room.submitOperations({
        actorId: message.actorId,
        baseRevision: message.baseRevision,
        operations: message.operations
      });

      if (result.ok) {
        const snapshot = room.snapshotMessage();
        savePersistedDocument(snapshot.document);
        console.log(
          `[room:${client.roomId}] accepted ${message.operations.length} op(s) from ${message.actorId}; revision ${snapshot.revision}; root nodes ${snapshot.document.scene.rootIds.length}`
        );
        broadcastToRoom(client.roomId, result.acceptedMessage);
        broadcastToRoom(client.roomId, snapshot);
        return;
      }

      console.warn(
        `[room:${client.roomId}] rejected op(s) from ${message.actorId}: ${result.rejectedMessage.reason}; expected revision ${result.rejectedMessage.expectedRevision}; client base ${message.baseRevision}`
      );
      client.socket.send(JSON.stringify(result.rejectedMessage));
      return;
    }

    case "save-document": {
      const room = rooms.replaceDocument(
        message.documentId,
        client.userId ?? message.actorId,
        {
          ...message.document,
          id: message.documentId,
          metadata: {
            ...message.document.metadata,
            updatedAt: new Date().toISOString()
          }
        }
      );
      const snapshot = room.snapshotMessage();
      savePersistedDocument(snapshot.document);
      const savedMessage = createDocumentSavedMessage(
        snapshot.documentId,
        snapshot.revision,
        snapshot.document.metadata.updatedAt
      );

      console.log(
        `[room:${message.documentId}] saved explicit snapshot from ${message.actorId}; revision ${snapshot.revision}; root nodes ${snapshot.document.scene.rootIds.length}`
      );
      client.socket.send(JSON.stringify(savedMessage));
      broadcastToRoom(message.documentId, snapshot);
      return;
    }

    case "presence.update": {
      if (!client.roomId) {
        return;
      }

      client.presence = {
        ...message.presence,
        documentId: client.roomId,
        userId: client.userId ?? message.presence.userId,
        name: client.name,
        color: client.color
      };

      broadcastToRoom(
        client.roomId,
        createPresenceSyncMessage(client.roomId, roomPresence(client.roomId))
      );
      return;
    }

    case "request-resync": {
      if (!client.roomId) {
        return;
      }

      const room = rooms.getOrCreate(client.roomId, client.userId ?? createId("user"));
      client.socket.send(JSON.stringify(room.snapshotMessage()));
      return;
    }
  }
}

const server = new WebSocketServer({ port });

server.on("connection", (socket) => {
  const client: ConnectedClient = {
    socket,
    roomId: null,
    userId: null,
    name: "Anonymous",
    color: "#1d6c74",
    presence: null
  };

  clients.set(socket, client);

  socket.on("message", (data) => handleClientMessage(client, data.toString()));

  socket.on("close", () => {
    const roomId = client.roomId;
    clients.delete(socket);

    if (roomId) {
      broadcastToRoom(roomId, createPresenceSyncMessage(roomId, roomPresence(roomId)));
    }
  });
});

console.log(`Collaboration server listening on ws://localhost:${port}`);
console.log(`Room snapshots persist to ${persistedDocumentDirectory()}`);
console.log("Persistence is file-backed for local development. Add Postgres snapshots and auth before production.");
