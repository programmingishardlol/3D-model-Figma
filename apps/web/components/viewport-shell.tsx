// @ts-nocheck
"use client";

import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { deriveDisplayMeshes } from "@figma-3d/3d-core";
import type { DisplayMesh } from "@figma-3d/3d-core";
import type { DesignDocument, NodeId } from "@figma-3d/shared";

type ViewportShellProps = {
  document: DesignDocument;
  selectedNodeId: NodeId | null;
};

function isBoxLikeMesh(mesh: DisplayMesh): mesh is Extract<DisplayMesh, { kind: "box" | "extrusion" }> {
  return mesh.kind === "box" || mesh.kind === "extrusion";
}

export function ViewportShell({ document, selectedNodeId }: ViewportShellProps) {
  const meshes = deriveDisplayMeshes(document);

  return (
    <section className="viewport-shell">
      <div className="panel viewport-canvas">
        <Canvas camera={{ position: [5.5, 4.2, 6], fov: 42 }}>
          <color attach="background" args={["#f8f4ed"]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[6, 9, 4]} intensity={1.1} />
          <Grid
            args={[18, 18]}
            cellColor="#d3c8b9"
            sectionColor="#bba993"
            fadeDistance={28}
            fadeStrength={1}
          />
          {meshes.map((mesh) => {
            const isSelected = mesh.sourceNodeId === selectedNodeId;
            const color = isSelected ? "#2d6474" : mesh.color;
            const [x, y, z] = mesh.transform.position;
            const [rx, ry, rz] = mesh.transform.rotation;

            if (isBoxLikeMesh(mesh)) {
              const [width, height, depth] = mesh.size;

              return (
                <mesh key={mesh.id} position={[x, y, z]} rotation={[rx, ry, rz]}>
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial color={color} wireframe />
                </mesh>
              );
            }

            return (
              <mesh key={mesh.id} position={[x, y, z]} rotation={[rx, ry, rz]}>
                <cylinderGeometry args={[mesh.radius, mesh.radius, mesh.height, 32]} />
                <meshStandardMaterial color={color} wireframe />
              </mesh>
            );
          })}
          <OrbitControls makeDefault />
        </Canvas>
      </div>
      <div className="viewport-meta">
        <div className="stat-card">
          <div className="muted">Document Revision</div>
          <strong>{document.revision}</strong>
        </div>
        <div className="stat-card">
          <div className="muted">Scene Nodes</div>
          <strong>{document.scene.rootIds.length}</strong>
        </div>
        <div className="stat-card">
          <div className="muted">Derived Meshes</div>
          <strong>{meshes.length}</strong>
        </div>
      </div>
    </section>
  );
}
