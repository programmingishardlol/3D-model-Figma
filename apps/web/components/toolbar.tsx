"use client";

type ToolbarProps = {
  onCreateBox: () => void;
  onCreateCylinder: () => void;
  onCreateSketchPlane: () => void;
  onAddRectangle: () => void;
  onExtrude: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  disabled?: boolean;
};

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-title">
        <strong>Industrial Concept Space</strong>
        <span>Editable primitives, sketches, extrude, collaboration-ready operations.</span>
      </div>
      <div className="toolbar-actions">
        <button className="primary" disabled={props.disabled} onClick={props.onCreateBox}>
          Box
        </button>
        <button disabled={props.disabled} onClick={props.onCreateCylinder}>
          Cylinder
        </button>
        <button disabled={props.disabled} onClick={props.onCreateSketchPlane}>
          Sketch Plane
        </button>
        <button disabled={props.disabled} onClick={props.onAddRectangle}>
          Sketch Rectangle
        </button>
        <button disabled={props.disabled} onClick={props.onExtrude}>
          Extrude
        </button>
        <button disabled={props.disabled} onClick={props.onUndo}>
          Undo
        </button>
        <button disabled={props.disabled} onClick={props.onRedo}>
          Redo
        </button>
        <button disabled={props.disabled} onClick={props.onSave}>
          Save
        </button>
      </div>
    </div>
  );
}
