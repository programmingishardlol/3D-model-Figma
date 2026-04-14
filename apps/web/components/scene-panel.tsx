"use client";

import type { DesignDocument, NodeId, SceneNode } from "@figma-3d/shared";

type ScenePanelProps = {
  document: DesignDocument;
  selectedNodeId: NodeId | null;
  onSelectNode: (nodeId: NodeId) => void;
};

function nodeBadge(node: SceneNode) {
  switch (node.kind) {
    case "primitive":
      return node.primitive.kind;
    case "sketchPlane":
      return "sketch";
    case "body":
      return "body";
    case "group":
      return "group";
  }
}

export function ScenePanel({ document, selectedNodeId, onSelectNode }: ScenePanelProps) {
  const nodes = document.scene.rootIds
    .map((id) => document.scene.nodes[id])
    .filter(Boolean);

  return (
    <aside className="panel">
      <h2>Scene</h2>
      <div className="scene-list">
        {nodes.map((node) => (
          <button
            key={node.id}
            className="scene-item"
            data-selected={node.id === selectedNodeId}
            onClick={() => onSelectNode(node.id)}
          >
            <span>{node.name}</span>
            <small>{nodeBadge(node)}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
