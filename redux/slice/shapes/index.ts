import {
  createSlice,
  createEntityAdapter,
  nanoid,
  PayloadAction,
  EntityState,
  current,
} from "@reduxjs/toolkit";
import type { Point } from "../viewport";

export type Tool =
  | "select"
  | "frame"
  | "rect"
  | "ellipse"
  | "freedraw"
  | "arrow"
  | "line"
  | "text"
  | "eraser";

export interface BaseShape {
  id: string;
  stroke: string;
  strokeWidth: number;
  fill?: string | null;
}
export interface FrameShape extends BaseShape {
  type: "frame";
  x: number;
  y: number;
  w: number;
  h: number;
  frameNumber: number;
  name?: string;
}
export interface RectShape extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface EllipseShape extends BaseShape {
  type: "ellipse";
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface FreeDrawShape extends BaseShape {
  type: "freedraw";
  points: Point[];
}
export interface ArrowShape extends BaseShape {
  type: "arrow";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export interface LineShape extends BaseShape {
  type: "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export interface TextShape extends BaseShape {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  textDecoration:
    | "none"
    | "underline"
    | "line-through"
    | "line-through underline";
  lineHeight: number;
  letterSpacing: number;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface GeneratedUIShape extends BaseShape {
  type: "generatedui";
  x: number;
  y: number;
  w: number;
  h: number;
  uiSpecData: string | null;
  sourceFrameId: string;
  isWorkflowPage?: boolean; // Flag to identify workflow pages
}

export type Shape =
  | FrameShape
  | RectShape
  | EllipseShape
  | FreeDrawShape
  | ArrowShape
  | LineShape
  | TextShape
  | GeneratedUIShape;

const shapesAdapter = createEntityAdapter<Shape, string>({
  selectId: (s) => s.id,
});

const MAX_HISTORY = 100;

type ShapesSnapshot = {
  shapes: EntityState<Shape, string>;
  frameCounter: number;
};

const pushWithLimit = (history: ShapesSnapshot[], snapshot: ShapesSnapshot) => {
  history.push(snapshot);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
};

const applySnapshot = (state: ShapesState, snapshot: ShapesSnapshot) => {
  Object.assign(state.shapes, snapshot.shapes);
  state.frameCounter = snapshot.frameCounter;
};

const recordSnapshot = (state: ShapesState) => {
  const now = Date.now();
  const last = state.lastSnapshotAt ?? 0;
  // Throttle snapshots to at most ~1 per 800ms to make undo/redo smoother
  if (now - last < 800) return;
  const snapshot: ShapesSnapshot = {
    shapes: current(state.shapes) as EntityState<Shape, string>,
    frameCounter: state.frameCounter,
  };
  pushWithLimit(state.past, snapshot);
  state.future = [];
  state.lastSnapshotAt = now;
};

const pushSnapshotImmediate = (state: ShapesState) => {
  const now = Date.now();
  const snapshot: ShapesSnapshot = {
    shapes: current(state.shapes) as EntityState<Shape, string>,
    frameCounter: state.frameCounter,
  };
  pushWithLimit(state.past, snapshot);
  state.future = [];
  state.lastSnapshotAt = now;
};

type SelectionMap = Record<string, true>;

type GenerationStatus = "idle" | "generating" | "ready" | "error";

interface ShapesState {
  tool: Tool;
  shapes: EntityState<Shape, string>;
  selected: SelectionMap;
  frameCounter: number;
  past: ShapesSnapshot[];
  future: ShapesSnapshot[];
  generationStatus: Record<string, GenerationStatus>;
  lastSnapshotAt?: number;
}

const initialState: ShapesState = {
  tool: "select",
  shapes: shapesAdapter.getInitialState(),
  selected: {},
  frameCounter: 0,
  past: [],
  future: [],
  generationStatus: {},
  lastSnapshotAt: 0,
};

const DEFAULTS = { stroke: "#ffff", strokeWidth: 2 as const };

const makeFrame = (p: {
  x: number;
  y: number;
  w: number;
  h: number;
  frameNumber: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  name?: string;
}): FrameShape => ({
  id: nanoid(),
  type: "frame",
  x: p.x,
  y: p.y,
  w: p.w,
  h: p.h,
  frameNumber: p.frameNumber,
  // Default name uses the frame number; can be overridden.
  name: p.name ?? `Frame ${p.frameNumber}`,
  stroke: "transparent",
  strokeWidth: 0,
  fill: p.fill ?? "rgba(255, 255, 255, 0.05)",
});

const makeRect = (p: {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): RectShape => ({
  id: nanoid(),
  type: "rect",
  x: p.x,
  y: p.y,
  w: p.w,
  h: p.h,
  stroke: p.stroke ?? DEFAULTS.stroke,
  strokeWidth: p.strokeWidth ?? DEFAULTS.strokeWidth,
  fill: p.fill ?? null,
});

const makeEllipse = (p: {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): EllipseShape => ({
  id: nanoid(),
  type: "ellipse",
  x: p.x,
  y: p.y,
  w: p.w,
  h: p.h,
  stroke: p.stroke ?? DEFAULTS.stroke,
  strokeWidth: p.strokeWidth ?? DEFAULTS.strokeWidth,
  fill: p.fill ?? null,
});

const makeFree = (p: {
  points: Point[];
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): FreeDrawShape => ({
  id: nanoid(),
  type: "freedraw",
  points: p.points,
  stroke: p.stroke ?? DEFAULTS.stroke,
  strokeWidth: p.strokeWidth ?? DEFAULTS.strokeWidth,
  fill: p.fill ?? null,
});

const makeArrow = (p: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): ArrowShape => ({
  id: nanoid(),
  type: "arrow",
  startX: p.startX,
  startY: p.startY,
  endX: p.endX,
  endY: p.endY,
  stroke: p.stroke ?? DEFAULTS.stroke,
  strokeWidth: p.strokeWidth ?? DEFAULTS.strokeWidth,
  fill: p.fill ?? null,
});

const makeLine = (p: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): LineShape => ({
  id: nanoid(),
  type: "line",
  startX: p.startX,
  startY: p.startY,
  endX: p.endX,
  endY: p.endY,
  stroke: p.stroke ?? DEFAULTS.stroke,
  strokeWidth: p.strokeWidth ?? DEFAULTS.strokeWidth,
  fill: p.fill ?? null,
});

const makeText = (p: {
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  textDecoration?:
    | "none"
    | "underline"
    | "line-through"
    | "line-through underline";
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}): TextShape => ({
  id: nanoid(),
  type: "text",
  x: p.x,
  y: p.y,
  text: p.text ?? "Type here...", // Start with placeholder text
  fontSize: p.fontSize ?? 16,
  fontFamily: p.fontFamily ?? "Inter, sans-serif",
  fontWeight: p.fontWeight ?? 400,
  fontStyle: p.fontStyle ?? "normal",
  textAlign: p.textAlign ?? "left",
  textDecoration: p.textDecoration ?? "none",
  lineHeight: p.lineHeight ?? 1.2,
  letterSpacing: p.letterSpacing ?? 0,
  textTransform: p.textTransform ?? "none",
  stroke: p.stroke ?? DEFAULTS.stroke,
  strokeWidth: p.strokeWidth ?? DEFAULTS.strokeWidth,
  fill: p.fill ?? "#ffffff",
});

const makeGeneratedUI = (p: {
  x: number;
  y: number;
  w: number;
  h: number;
  uiSpecData: string | null; // HTML markup as string
  sourceFrameId: string;
  id?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
  isWorkflowPage?: boolean; // Flag to identify workflow pages
}): GeneratedUIShape => ({
  id: p.id ?? nanoid(),
  type: "generatedui",
  x: p.x,
  y: p.y,
  w: p.w,
  h: p.h,
  uiSpecData: p.uiSpecData,
  sourceFrameId: p.sourceFrameId,
  isWorkflowPage: p.isWorkflowPage,
  stroke: "transparent", // No border for generated UI
  strokeWidth: 0,
  fill: p.fill ?? null,
});

const shapesSlice = createSlice({
  name: "shapes",
  initialState,
  reducers: {
    undo(state) {
      if (state.past.length === 0) return;
      const currentSnapshot: ShapesSnapshot = {
        shapes: current(state.shapes) as EntityState<Shape, string>,
        frameCounter: state.frameCounter,
      };
      pushWithLimit(state.future, currentSnapshot);
      const prev = state.past.pop()!;
      applySnapshot(state, prev);
      state.selected = {};
    },
    redo(state) {
      if (state.future.length === 0) return;
      const currentSnapshot: ShapesSnapshot = {
        shapes: current(state.shapes) as EntityState<Shape, string>,
        frameCounter: state.frameCounter,
      };
      pushWithLimit(state.past, currentSnapshot);
      const next = state.future.pop()!;
      applySnapshot(state, next);
      state.selected = {};
    },
    setTool(state, action: PayloadAction<Tool>) {
      state.tool = action.payload;
      if (action.payload !== "select") state.selected = {};
    },

    addFrame(
      state,
      action: PayloadAction<
        Omit<Parameters<typeof makeFrame>[0], "frameNumber">
      >
    ) {
      recordSnapshot(state);
      state.frameCounter += 1;
      const frameWithNumber = {
        ...action.payload,
        frameNumber: state.frameCounter,
      };
      shapesAdapter.addOne(state.shapes, makeFrame(frameWithNumber));
    },
    addRect(state, action: PayloadAction<Parameters<typeof makeRect>[0]>) {
      recordSnapshot(state);
      shapesAdapter.addOne(state.shapes, makeRect(action.payload));
    },
    addEllipse(
      state,
      action: PayloadAction<Parameters<typeof makeEllipse>[0]>
    ) {
      recordSnapshot(state);
      shapesAdapter.addOne(state.shapes, makeEllipse(action.payload));
    },
    addFreeDrawShape(
      state,
      action: PayloadAction<Parameters<typeof makeFree>[0]>
    ) {
      const { points } = action.payload;
      if (!points || points.length === 0) return;
      recordSnapshot(state);
      shapesAdapter.addOne(state.shapes, makeFree(action.payload));
    },
    addArrow(state, action: PayloadAction<Parameters<typeof makeArrow>[0]>) {
      recordSnapshot(state);
      shapesAdapter.addOne(state.shapes, makeArrow(action.payload));
    },
    addLine(state, action: PayloadAction<Parameters<typeof makeLine>[0]>) {
      recordSnapshot(state);
      shapesAdapter.addOne(state.shapes, makeLine(action.payload));
    },
    addText(state, action: PayloadAction<Parameters<typeof makeText>[0]>) {
      recordSnapshot(state);
      shapesAdapter.addOne(state.shapes, makeText(action.payload));
    },
    addGeneratedUI(
      state,
      action: PayloadAction<Parameters<typeof makeGeneratedUI>[0]>
    ) {
      recordSnapshot(state);
      shapesAdapter.addOne(state.shapes, makeGeneratedUI(action.payload));
    },

    updateShape(
      state,
      action: PayloadAction<{ id: string; patch: Partial<Shape> }>
    ) {
      const { id, patch } = action.payload;
      recordSnapshot(state);
      shapesAdapter.updateOne(state.shapes, { id, changes: patch });
    },

    // Update without recording a snapshot; used for continuous interactions (drag/resize).
    updateShapeNoHistory(
      state,
      action: PayloadAction<{ id: string; patch: Partial<Shape> }>
    ) {
      const { id, patch } = action.payload;
      shapesAdapter.updateOne(state.shapes, { id, changes: patch });
    },

    // Force pushing a history checkpoint (no throttle)
    commitHistory(state) {
      pushSnapshotImmediate(state);
    },

    removeShape(state, action: PayloadAction<string>) {
      const id = action.payload;
      recordSnapshot(state);
      const shape = state.shapes.entities[id];
      if (shape?.type === "frame") {
        state.frameCounter = Math.max(0, state.frameCounter - 1);
      }
      shapesAdapter.removeOne(state.shapes, id);
      delete state.selected[id];
      delete state.generationStatus[id];
    },

    duplicateShapes(
      state,
      action: PayloadAction<{
        ids: string[];
        offset?: { dx: number; dy: number };
      }>
    ) {
      const { ids, offset } = action.payload;
      if (!ids.length) return;

      recordSnapshot(state);

      const dx = offset?.dx ?? 24;
      const dy = offset?.dy ?? 24;

      const newSelected: SelectionMap = {};

      for (const id of ids) {
        const original = state.shapes.entities[id];
        if (!original) continue;

        let cloned: Shape | null = null;

        switch (original.type) {
          case "frame": {
            state.frameCounter += 1;
            const newFrameNumber = state.frameCounter;
            cloned = {
              ...original,
              id: nanoid(),
              x: original.x + dx,
              y: original.y + dy,
              frameNumber: newFrameNumber,
              name: original.name ?? `Frame ${newFrameNumber}`,
            };
            break;
          }
          case "rect":
          case "ellipse":
          case "generatedui": {
            cloned = {
              ...original,
              id: nanoid(),
              x: original.x + dx,
              y: original.y + dy,
            } as Shape;
            break;
          }
          case "text": {
            cloned = {
              ...original,
              id: nanoid(),
              x: original.x + dx,
              y: original.y + dy,
            };
            break;
          }
          case "freedraw": {
            cloned = {
              ...original,
              id: nanoid(),
              points: original.points.map((p) => ({
                x: p.x + dx,
                y: p.y + dy,
              })),
            };
            break;
          }
          case "arrow":
          case "line": {
            cloned = {
              ...original,
              id: nanoid(),
              startX: original.startX + dx,
              startY: original.startY + dy,
              endX: original.endX + dx,
              endY: original.endY + dy,
            };
            break;
          }
        }

        if (cloned) {
          shapesAdapter.addOne(state.shapes, cloned);
          newSelected[cloned.id] = true;
        }
      }

      if (Object.keys(newSelected).length) {
        state.selected = newSelected;
      }
    },

    clearAll(state) {
      recordSnapshot(state);
      shapesAdapter.removeAll(state.shapes);
      state.selected = {};
      state.frameCounter = 0;
      state.generationStatus = {};
    },

    selectShape(state, action: PayloadAction<string>) {
      state.selected[action.payload] = true;
    },
    deselectShape(state, action: PayloadAction<string>) {
      delete state.selected[action.payload];
    },
    clearSelection(state) {
      state.selected = {};
    },
    selectAll(state) {
      const ids = state.shapes.ids as string[];
      state.selected = Object.fromEntries(ids.map((id) => [id, true]));
    },
    deleteSelected(state) {
      const ids = Object.keys(state.selected);
      if (ids.length) {
        recordSnapshot(state);
      }
      if (ids.length) shapesAdapter.removeMany(state.shapes, ids);
      state.selected = {};
    },
    loadProject(
      state,
      action: PayloadAction<{
        shapes: EntityState<Shape, string>;
        tool: Tool;
        selected: SelectionMap;
        frameCounter: number;
        generationStatus?: Record<string, GenerationStatus>;
      }>
    ) {
      // Load project data into the shapes state
      state.shapes = action.payload.shapes;
      state.tool = action.payload.tool;
      state.selected = action.payload.selected;
      state.frameCounter = action.payload.frameCounter;
      state.generationStatus =
        action.payload.generationStatus ?? {};
    },
    setGenerationStatus(
      state,
      action: PayloadAction<{
        shapeId: string;
        status: GenerationStatus;
      }>
    ) {
      state.generationStatus[action.payload.shapeId] =
        action.payload.status;
    },
  },
});

export const {
  undo,
  redo,
  setTool,
  addFrame,
  addRect,
  addEllipse,
  addFreeDrawShape,
  addArrow,
  addLine,
  addText,
  addGeneratedUI,
  updateShape,
  updateShapeNoHistory,
  commitHistory,
  duplicateShapes,
  removeShape,
  clearAll,
  selectShape,
  deselectShape,
  clearSelection,
  selectAll,
  deleteSelected,
  loadProject,
  setGenerationStatus,
} = shapesSlice.actions;

export default shapesSlice.reducer;
