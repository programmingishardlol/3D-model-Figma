import { createId } from "@figma-3d/shared";
import type { PresenceState } from "@figma-3d/protocol";

export const LOCAL_USER_ID = createId("user");
export const REMOTE_USER_ID = createId("user");

export const demoPresence: PresenceState[] = [
  {
    documentId: "doc_demo",
    userId: LOCAL_USER_ID,
    name: "You",
    color: "#1d6c74",
    selectedNodeIds: [],
    activeTool: "select",
    cursor: { x: 420, y: 260 },
    updatedAt: new Date().toISOString()
  },
  {
    documentId: "doc_demo",
    userId: REMOTE_USER_ID,
    name: "Ava",
    color: "#a94f3c",
    selectedNodeIds: [],
    activeTool: "review",
    cursor: { x: 360, y: 220 },
    updatedAt: new Date().toISOString()
  }
];
