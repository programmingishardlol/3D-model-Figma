import test from "node:test";
import assert from "node:assert/strict";
import { clearCurrentSocket, isCurrentSocket } from "./socket-session";

test("isCurrentSocket matches only the active socket instance", () => {
  const activeSocket = { id: "socket_a" };
  const staleSocket = { id: "socket_b" };

  assert.equal(isCurrentSocket(activeSocket, activeSocket), true);
  assert.equal(isCurrentSocket(activeSocket, staleSocket), false);
});

test("clearCurrentSocket ignores stale socket close events", () => {
  const activeSocket = { id: "socket_a" };
  const staleSocket = { id: "socket_b" };

  const result = clearCurrentSocket(activeSocket, staleSocket);

  assert.equal(result.cleared, false);
  assert.equal(result.nextSocket, activeSocket);
});

test("clearCurrentSocket clears only the active socket instance", () => {
  const activeSocket = { id: "socket_a" };

  const result = clearCurrentSocket(activeSocket, activeSocket);

  assert.equal(result.cleared, true);
  assert.equal(result.nextSocket, null);
});
