export function isCurrentSocket<T>(currentSocket: T | null, candidateSocket: T) {
  return currentSocket === candidateSocket;
}

export function clearCurrentSocket<T>(currentSocket: T | null, closingSocket: T) {
  if (currentSocket !== closingSocket) {
    return {
      nextSocket: currentSocket,
      cleared: false
    };
  }

  return {
    nextSocket: null,
    cleared: true
  };
}
