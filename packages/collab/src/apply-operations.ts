import { applyTransform } from "@figma-3d/3d-core";
import type { DesignDocument, DocumentOperation } from "@figma-3d/shared";

function cloneDocument(document: DesignDocument): DesignDocument {
  return structuredClone(document);
}

function removeNodeReference(document: DesignDocument, nodeId: string) {
  document.scene.rootIds = document.scene.rootIds.filter((id) => id !== nodeId);

  for (const node of Object.values(document.scene.nodes)) {
    node.childIds = node.childIds.filter((id) => id !== nodeId);
  }
}

export function applyOperation(document: DesignDocument, operation: DocumentOperation): DesignDocument {
  const nextDocument = cloneDocument(document);

  switch (operation.kind) {
    case "node.create": {
      nextDocument.scene.nodes[operation.node.id] = structuredClone(operation.node);
      if (operation.parentId) {
        const parent = nextDocument.scene.nodes[operation.parentId];
        if (parent) {
          parent.childIds.splice(operation.index, 0, operation.node.id);
        }
      } else {
        nextDocument.scene.rootIds.splice(operation.index, 0, operation.node.id);
      }
      break;
    }

    case "node.delete": {
      delete nextDocument.scene.nodes[operation.nodeId];
      removeNodeReference(nextDocument, operation.nodeId);
      break;
    }

    case "node.rename": {
      const node = nextDocument.scene.nodes[operation.nodeId];
      if (node) {
        node.name = operation.name;
      }
      break;
    }

    case "node.transform.set": {
      const node = nextDocument.scene.nodes[operation.nodeId];
      if (node) {
        nextDocument.scene.nodes[operation.nodeId] = applyTransform(node, operation.next);
      }
      break;
    }

    case "sketch.create": {
      nextDocument.sketches[operation.sketch.id] = structuredClone(operation.sketch);
      break;
    }

    case "sketch.delete": {
      delete nextDocument.sketches[operation.sketchId];
      break;
    }

    case "sketch.curve.add": {
      const sketch = nextDocument.sketches[operation.sketchId];
      if (sketch) {
        sketch.curves[operation.curve.id] = structuredClone(operation.curve);
        sketch.curveIds.push(operation.curve.id);
      }
      break;
    }

    case "sketch.curve.remove": {
      const sketch = nextDocument.sketches[operation.sketchId];
      if (sketch) {
        delete sketch.curves[operation.curveId];
        sketch.curveIds = sketch.curveIds.filter((id) => id !== operation.curveId);
      }
      break;
    }

    case "feature.create": {
      nextDocument.features[operation.feature.id] = structuredClone(operation.feature);
      break;
    }

    case "feature.delete": {
      delete nextDocument.features[operation.featureId];
      break;
    }
  }

  nextDocument.revision = document.revision + 1;
  nextDocument.metadata.updatedAt = new Date().toISOString();
  return nextDocument;
}

export function applyOperations(document: DesignDocument, operations: DocumentOperation[]): DesignDocument {
  return operations.reduce((current, operation) => applyOperation(current, operation), document);
}
