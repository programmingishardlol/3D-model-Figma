"use client";

import type { PresenceState } from "@figma-3d/protocol";

type PresencePanelProps = {
  presence: PresenceState[];
};

export function PresencePanel({ presence }: PresencePanelProps) {
  return (
    <section className="panel">
      <h2>Presence</h2>
      <div className="presence-list">
        {presence.map((entry) => (
          <div className="presence-pill" key={entry.userId}>
            <span className="presence-dot" style={{ backgroundColor: entry.color }} />
            <strong>{entry.name}</strong>
            <small className="muted">{entry.activeTool}</small>
            {entry.selectedNodeIds.length > 0 ? (
              <small className="muted">selecting {entry.selectedNodeIds.length}</small>
            ) : null}
          </div>
        ))}
        {presence.length === 0 ? <small className="muted">No collaborators connected yet.</small> : null}
      </div>
    </section>
  );
}
