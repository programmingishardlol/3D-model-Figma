"use client";

import { useEffect, useState } from "react";
import type { DesignDocument, NodeId } from "@figma-3d/shared";

type PropertiesPanelProps = {
  document: DesignDocument;
  selectedNodeId: NodeId | null;
  onRename: (nodeId: NodeId, name: string) => void;
  onNudge: (nodeId: NodeId, axis: "x" | "y" | "z", delta: number) => void;
  onRemove: (nodeId: NodeId) => void;
  disabled?: boolean;
};

export function PropertiesPanel({
  document,
  selectedNodeId,
  onRename,
  onNudge,
  onRemove,
  disabled = false
}: PropertiesPanelProps) {
  const node = selectedNodeId ? document.scene.nodes[selectedNodeId] : null;
  const [draftName, setDraftName] = useState(node?.name ?? "");

  useEffect(() => {
    setDraftName(node?.name ?? "");
  }, [node?.id, node?.name]);

  if (!node) {
    return (
      <aside className="panel">
        <h2>Properties</h2>
        <p className="muted">Select a node to inspect its parameters and transform.</p>
      </aside>
    );
  }

  return (
    <aside className="panel">
      <h2>Properties</h2>
      <div className="properties-grid">
        <label>
          Name
          <input
            disabled={disabled}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>
        <button disabled={disabled} onClick={() => onRename(node.id, draftName.trim() || node.name)}>
          Apply Rename
        </button>
        <button disabled={disabled} onClick={() => onRemove(node.id)}>
          Remove Selected
        </button>
        <div>
          <div className="muted">Type</div>
          <strong>{node.kind}</strong>
        </div>
        <div>
          <div className="muted">Position</div>
          <strong>
            {node.transform.position.map((value) => value.toFixed(2)).join(", ")}
          </strong>
        </div>
        <div className="nudge-row">
          <button disabled={disabled} onClick={() => onNudge(node.id, "x", 0.25)}>
            Move +X
          </button>
          <button disabled={disabled} onClick={() => onNudge(node.id, "x", -0.25)}>
            Move -X
          </button>
          <button disabled={disabled} onClick={() => onNudge(node.id, "z", 0.25)}>
            Move +Z
          </button>
          <button disabled={disabled} onClick={() => onNudge(node.id, "z", -0.25)}>
            Move -Z
          </button>
        </div>
      </div>
    </aside>
  );
}
