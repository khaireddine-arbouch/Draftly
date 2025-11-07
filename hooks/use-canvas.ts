import { AppDispatch, useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import {
  panMove,
  wheelZoom,
  wheelPan,
  type Point,
  panStart,
  screenToWorld,
  panEnd,
  handToolDisable,
  handToolEnable,
} from "@/redux/slice/viewport";
import { initialViewportState } from "@/redux/slice/viewport";
import {
  addArrow,
  addEllipse,
  addFrame,
  addFreeDrawShape,
  addLine,
  addRect,
  addText,
  clearSelection,
  FrameShape,
  removeShape,
  selectShape,
  setTool,
  Tool,
  updateShape,
  type Shape,
} from "@/redux/slice/shapes";
import { useCallback, useEffect, useRef, useState } from "react";
import { downloadBlob, generateFrameSnapshot } from "@/lib/frame-snapshot";

interface TouchPointer {
  id: number;
  p: Point;
}

const RAF_INTERVAL_MS = 60;

interface DraftShape {
  type: "frame" | "rect" | "ellipse" | "arrow" | "line";
  startWorld: Point;
  currentWorld: Point;
}
export const useInfiniteCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();

  const viewport =
    useAppSelector((state) => state.viewport) ?? initialViewportState;
  const entityState = useAppSelector((state) => state.shapes);

  // Use the entity adapter nested under state.shapes.shapes
  const shapeList: Shape[] = ((entityState?.shapes?.ids as string[]) ?? [])
    .map((id: string) => entityState?.shapes?.entities?.[id])
    .filter((s: Shape | undefined): s is Shape => Boolean(s));

  const currentTool = useAppSelector((s) => s.shapes.tool);

  const selectedShapes = useAppSelector((s) => s.shapes.selected);

  // Get the shapes entities from the Redux store
  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities
  );

  // Check if any selected shape is of type 'text'
  const hasSelectedText = Object.keys(selectedShapes).some((id) => {
    const shape = shapesEntities[id]; // Get the shape entity by ID
    return shape?.type === "text"; // Return true if the shape type is 'text'
  });

  // Sidebar visibility is derived from selection state
  const isSidebarOpen = hasSelectedText;

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const touchMapRef = useRef<Map<number, TouchPointer>>(new Map());

  const draftShapeRef = useRef<DraftShape | null>(null);

  const freeDrawPointsRef = useRef<Point[]>([]);

  const isSpacePressed = useRef(false);
  const isShiftPressed = useRef(false);

  const isDrawingRef = useRef(false);

  const isMovingRef = useRef(false);

  const moveStartRef = useRef<Point | null>(null);

  const initialShapePositionsRef = useRef<
    Record<
      string,
      {
        x?: number;
        y?: number;
        points?: Point[];
        startX?: number;
        startY?: number; // Fixed 'starty' to 'startY'
        endX?: number;
        endY?: number;
      }
    >
  >({}); // Initialize as an empty object
  const isErasingRef = useRef(false); // Ref to track whether erasing is active

  const erasedShapesRef = useRef<Set<string>>(new Set()); // Ref to store erased shapes

  const isResizingRef = useRef(false); // Ref to track whether resizing is active

  const resizeDataRef = useRef<{
    shapeId: string;
    corner: string;
    initialBounds: { x: number; y: number; w: number; h: number }; // Initial bounds of the shape
    startPoint: { x: number; y: number }; // Starting point of resizing
  } | null>(null); // Stores resize data or null if not resizing

  const lastFreehandFrameRef = useRef(0); // Fixed 'lastFreehand FrameRef' to 'lastFreehandFrameRef'

  const freehandRafRef = useRef<number | null>(null); // Ref to store the freehand animation frame ID

  const panRafRef = useRef<number | null>(null); // Ref to store the pan animation frame ID
  const moveRafRef = useRef<number | null>(null); // RAF for batched move updates
  const pendingMoveDeltaRef = useRef<Point | null>(null); // Pending delta for move
  const pendingPanPointRef = useRef<Point | null>(null);

  // Marquee selection state (drag-to-select)
  const isSelectingRef = useRef(false);
  const selectionMarqueeRef = useRef<{
    startWorld: Point;
    currentWorld: Point;
    additive: boolean; // shift-add selection
  } | null>(null);

  const [, force] = useState(0);

  // Function to trigger a re-render by updating the state
  const requestRender = (): void => {
    force((n) => n + 1); // Increment the state value
  };

  // Converts client coordinates to relative coordinates within the canvas
  const localPointFromClient = (clientX: number, clientY: number): Point => {
    const el = canvasRef.current;
    if (!el) return { x: clientX, y: clientY }; // Return the original position if the canvas element is not found

    const rect = el.getBoundingClientRect(); // Get the bounding rectangle of the canvas
    return { x: clientX - rect.left, y: clientY - rect.top }; // Adjust the point to canvas coordinates
  };

  // Function to blur an active text input element
  const blurActiveTextInput = () => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      (activeElement as HTMLInputElement).blur(); // Blur the input element
    }
  };

  type WithClientXY = { clientX: number; clientY: number };
  const getLocalPointFromPtr = (e: WithClientXY): Point =>
    localPointFromClient(e.clientX, e.clientY);

  const getShapeAtPoint = (worldPoint: Point): Shape | null => {
    // Iterate backwards through the shape list (topmost shapes first)
    for (let i = shapeList.length - 1; i >= 0; i--) {
      const shape = shapeList[i];
      if (isPointInShape(worldPoint, shape)) {
        return shape; // Return the first shape found at the point
      }
    }
    return null; // No shape found at the given point
  };

  const isPointInShape = (point: Point, shape: Shape): boolean => {
    switch (shape.type) {
      case "frame":
      case "rect":
      case "ellipse":
      case "generatedui":
        return (
          point.x >= shape.x &&
          point.x <= shape.x + shape.w &&
          point.y >= shape.y &&
          point.y <= shape.y + shape.h
        );
      case "freedraw": {
        const threshold = 5; // Distance threshold to check if the point is near the freehand path

        // Loop through the points in the shape
        for (let i = 0; i < shape.points.length - 1; i++) {
          const p1 = shape.points[i]; // Current point
          const p2 = shape.points[i + 1]; // Next point

          // Check if the point is within the threshold distance from the line segment
          if (distanceToLineSegment(point, p1, p2) <= threshold) {
            return true; // The point is close enough to the line segment, return true
          }
        }

        return false; // No segment matched, return false
      }
      case "arrow":
      case "line": {
        const lineThreshold = 8; // Distance threshold to check if the point is near the line

        // Return true if the point is within the threshold distance from the line segment
        return (
          distanceToLineSegment(
            point,
            { x: shape.startX, y: shape.startY }, // Corrected typo: 'starty' to 'startY'
            { x: shape.endX, y: shape.endY }
          ) <= lineThreshold
        );
      }

      case "text": {
        const textWidth = Math.max(
          shape.text.length * (shape.fontSize * 0.6),
          100
        ); // Calculate text width based on text length and font size, with a minimum of 100

        const textHeight = shape.fontSize * 1.2; // Calculate text height based on font size

        const padding = 8; // Define padding around the text

        // Return true if the point is within the bounds of the text box (with padding)
        return (
          point.x >= shape.x - 2 && // Point is to the right of the left boundary
          point.x <= shape.x + textWidth + padding + 2 && // Point is to the left of the right boundary
          point.y >= shape.y - 2 && // Point is below the top boundary
          point.y <= shape.y + textHeight + padding + 2 // Point is above the bottom boundary
        );
      }

      default:
        return false;
    }
  };

  const distanceToLineSegment = (
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number => {
    // Vector from lineStart to point
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;

    // Vector from lineStart to lineEnd
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    // Dot product of A and C, and B and D
    const dot = A * C + B * D;

    // Length squared of the line segment
    const lenSq = C * C + D * D;

    // If the length squared is zero (i.e., lineStart == lineEnd), return the distance to lineStart
    let param = -1; // Default parameter value when the projection is outside the line segment

    if (lenSq !== 0) {
      param = dot / lenSq; // Parametric representation of the projection on the line segment
    }

    // If the projection point is outside the line segment, clamp it to the nearest endpoint
    const xx =
      param < 0 ? lineStart.x : param > 1 ? lineEnd.x : lineStart.x + param * C;
    const yy =
      param < 0 ? lineStart.y : param > 1 ? lineEnd.y : lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const schedulePanMove = (p: Point) => {
    pendingPanPointRef.current = p; // Store the pending pan point

    // If an animation frame is already scheduled, return
    if (panRafRef.current != null) return;

    // Schedule the pan move animation frame
    panRafRef.current = window.requestAnimationFrame(() => {
      panRafRef.current = null; // Clear the reference when the frame is executed
      const next = pendingPanPointRef.current; // Get the latest pending point
      if (next) {
        dispatch(panMove(next)); // Dispatch the pan move action with the next point
      }
    });
  };

  const freehandTick = (now: number): void => {
    // Check if the frame interval has passed (RAF_INTERVAL_MS is the frame interval)
    if (now - lastFreehandFrameRef.current >= RAF_INTERVAL_MS) {
      if (freeDrawPointsRef.current.length > 0) {
        requestRender(); // Trigger a render if there are points to draw
      }
      lastFreehandFrameRef.current = now; // Update the last frame time
    }

    // Handle the case where drawing is active
    if (isDrawingRef.current) {
      // Request the next animation frame
      freehandRafRef.current = window.requestAnimationFrame(freehandTick);
    }
  };

  const onWheel = (e: WheelEvent): void => {
    e.preventDefault(); // Prevent the default scrolling behavior

    const originScreen = localPointFromClient(e.clientX, e.clientY); // Get the screen position from the client

    if (e.ctrlKey || e.metaKey) {
      // If ctrlKey or metaKey (Cmd key on Mac), trigger zoom
      dispatch(wheelZoom({ deltaY: e.deltaY, originScreen }));
    } else {
      // Otherwise, handle panning with the shift key
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;

      // Dispatch the pan action, with inverted dy for correct direction
      dispatch(wheelPan({ dx, dy: -dy }));
    }
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement; // Cast target to HTMLElement
    const isButton =
      target.tagName === "BUTTON" || // Check if the target is a button
      target.closest("button"); // Check if the closest ancestor is a button

    if (!isButton) {
      e.preventDefault(); // Prevent default behavior if the target is not a button
    } else {
      console.log(
        "Not preventing default, clicked on interactive element:",
        target
      );
      return; // Don't handle canvas interactions when clicking on buttons
    }

    // Get the local point from the pointer event
    const local = getLocalPointFromPtr(e.nativeEvent);

    // Convert the local point to world coordinates
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    // Handle the case when there are no more than one touch point
    if (touchMapRef.current.size <= 1) {
      canvasRef.current?.setPointerCapture?.(e.pointerId); // Capture the pointer

      // Determine if the button pressed is a pan button (middle or right click)
      const isPanButton = e.button === 1 || e.button === 2; // 1: middle button, 2: right button

      // Check if shift or space key is pressed for special panning behavior
      const panByShift = isSpacePressed.current && e.button === 0;

      // If it's a pan button or space key + left click, start the panning
      if (isPanButton || panByShift) {
        const mode = isSpacePressed.current ? "shiftPanning" : "panning"; // Determine pan mode based on space key
        dispatch(panStart({ screen: local, mode })); // Dispatch pan start action with the local screen coordinates and mode
        return; // Prevent further handling if panning starts
      }

      if (e.button === 0) {
        // Check if the left mouse button is clicked (0 is the left button)
        if (currentTool === "select") {
          // Ensure the current tool is set to 'select'
          const hitShape = getShapeAtPoint(world) as Shape; // Get the shape at the given world coordinates

          if (hitShape) {
            // Check if the shape is already selected
            const isAlreadySelected = selectedShapes[hitShape.id];

            if (!isAlreadySelected) {
              // If the shift key is not pressed, clear the current selection
              if (!e.shiftKey) {
                dispatch(clearSelection());
              }

              // Select the shape
              dispatch(selectShape(hitShape.id));
            }
          }

          // Mark that we are now moving the shape
          isMovingRef.current = true;
          moveStartRef.current = world; // Set the starting point of the move

          initialShapePositionsRef.current = {}; // Clear previous data

          Object.keys(selectedShapes).forEach((id) => {
            const shape = entityState.shapes.entities[id]; // Get the shape from the entities

            if (shape) {
              // Check if the shape type is one of the specified types
              if (
                shape.type === "frame" ||
                shape.type === "rect" ||
                shape.type === "ellipse" ||
                shape.type === "generatedui"
              ) {
                // Store the initial position of the shape
                initialShapePositionsRef.current[id] = {
                  x: shape.x,
                  y: shape.y,
                };
              } else if (shape.type === "freedraw") {
                initialShapePositionsRef.current[id] = {
                  points: [...shape.points],
                };
              } else if (shape.type === "arrow" || shape.type === "line") {
                initialShapePositionsRef.current[id] = {
                  startX: shape.startX,
                  startY: shape.startY,
                  endX: shape.endX,
                  endY: shape.endY,
                };
              } else if (shape.type === "text") {
                initialShapePositionsRef.current[id] = {
                  x: shape.x,
                  y: shape.y,
                };
              }
            }
          });

          // If no shape was hit, start marquee selection
          if (!hitShape) {
            if (!e.shiftKey) {
              dispatch(clearSelection());
              blurActiveTextInput();
            }
            isMovingRef.current = false;
            moveStartRef.current = null;
            isSelectingRef.current = true;
            selectionMarqueeRef.current = {
              startWorld: world,
              currentWorld: world,
              additive: !!e.shiftKey,
            };
            requestRender();
            return;
          }

          if (
            hitShape.type === "frame" ||
            hitShape.type === "rect" ||
            hitShape.type === "ellipse" ||
            hitShape.type === "generatedui"
          ) {
            // If the shape is one of these types, store its position (x, y)
            initialShapePositionsRef.current[hitShape.id] = {
              x: hitShape.x,
              y: hitShape.y,
            };
          } else if (hitShape.type === "freedraw") {
            // If the shape is of type 'freedraw', store its points
            initialShapePositionsRef.current[hitShape.id] = {
              points: [...hitShape.points], // Spread the points array to avoid reference issues
            };
          } else if (hitShape.type === "arrow" || hitShape.type === "line") {
            // For 'arrow' or 'line' types, store start and end coordinates
            initialShapePositionsRef.current[hitShape.id] = {
              startX: hitShape.startX,
              startY: hitShape.startY, // Fixed typo ('starty' -> 'startY')
              endX: hitShape.endX,
              endY: hitShape.endY, // Fixed typo ('endy' -> 'endY')
            };
          } else if (hitShape.type === "text") {
            // For 'text' type, store the text position
            initialShapePositionsRef.current[hitShape.id] = {
              x: hitShape.x,
              y: hitShape.y,
            };
          } else {
            if (!e.shiftKey) {
              dispatch(clearSelection());
              blurActiveTextInput();
            }
          }
        } else if (currentTool === "eraser") {
          // Corrected comparison operator (===)
          isErasingRef.current = true; // Set the erasing state to true
          erasedShapesRef.current.clear(); // Clear any previously erased shapes

          const hitShape = getShapeAtPoint(world); // Get the shape at the given world coordinates

          if (hitShape) {
            // If a shape is hit, remove it and add it to the erased shapes reference
            dispatch(removeShape(hitShape.id));
            erasedShapesRef.current.add(hitShape.id); // Keep track of erased shapes
          } else {
            // If no shape is hit, blur any active text input
            blurActiveTextInput();
          }
        } else if (currentTool === "text") {
          dispatch(addText({ x: world.x, y: world.y }));
          dispatch(setTool("select"));
        } else {
          isDrawingRef.current = true;
          if (
            currentTool === "frame" ||
            currentTool === "rect" ||
            currentTool === "ellipse" ||
            currentTool === "arrow" ||
            currentTool === "line"
          ) {
            draftShapeRef.current = {
              type: currentTool,
              startWorld: world,
              currentWorld: world,
            };

            requestRender(); // Request render after setting draft shape
          } else if (currentTool === "freedraw") {
            freeDrawPointsRef.current = [world]; // Fixed the array syntax
            lastFreehandFrameRef.current = 0; // Initialize; first RAF tick will update
            freehandRafRef.current = window.requestAnimationFrame(freehandTick); // Request the next animation frame for the freehand drawing
            requestRender(); // Request render for freehand drawing
          }
        }
      }
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const local = getLocalPointFromPtr(e.nativeEvent); // Get the local point from pointer event
    const world = screenToWorld(local, viewport.translate, viewport.scale); // Convert to world coordinates

    // Check if we are panning or shift panning
    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      schedulePanMove(local); // Schedule the pan move if in panning mode
      return; // Exit the function early if panning
    }

    // If we are in eraser mode and the current tool is 'eraser'
    if (isErasingRef.current && currentTool === "eraser") {
      const hitShape = getShapeAtPoint(world); // Get the shape at the world point

      // If the shape is valid and has not already been erased
      if (hitShape && !erasedShapesRef.current.has(hitShape.id)) {
        // Delete the shape and add it to the erased shapes set
        dispatch(removeShape(hitShape.id));
        erasedShapesRef.current.add(hitShape.id);
      }
    }

    if (
      isMovingRef.current &&
      moveStartRef.current &&
      currentTool === "select"
    ) {
      const deltaX = world.x - moveStartRef.current.x; // Calculate the difference in X
      const deltaY = world.y - moveStartRef.current.y; // Calculate the difference in Y

      pendingMoveDeltaRef.current = { x: deltaX, y: deltaY };
      if (moveRafRef.current == null) {
        moveRafRef.current = window.requestAnimationFrame(() => {
          moveRafRef.current = null;
          const pending = pendingMoveDeltaRef.current;
          if (!pending) return;
          Object.keys(initialShapePositionsRef.current).forEach((id) => {
            const initialPos = initialShapePositionsRef.current[id] as
              | {
                  x?: number;
                  y?: number;
                  startX?: number;
                  startY?: number;
                  endX?: number;
                  endY?: number;
                  points?: Point[];
                }
              | undefined;
            const shape = entityState.shapes.entities[id];
            if (shape && initialPos) {
              if (
                shape.type === "frame" ||
                shape.type === "rect" ||
                shape.type === "ellipse" ||
                shape.type === "generatedui"
              ) {
                if (
                  typeof initialPos.x === "number" &&
                  typeof initialPos.y === "number"
                ) {
                  dispatch(
                    updateShape({
                      id,
                      patch: {
                        x: initialPos.x + pending.x,
                        y: initialPos.y + pending.y,
                      },
                    })
                  );
                }
              } else if (shape.type === "freedraw") {
                const initialPoints = initialPos.points;
                if (initialPoints) {
                  const newPoints = initialPoints.map((point: Point) => ({
                    x: point.x + pending.x,
                    y: point.y + pending.y,
                  }));
                  dispatch(updateShape({ id, patch: { points: newPoints } }));
                }
              } else if (shape.type === "arrow" || shape.type === "line") {
                if (
                  typeof initialPos.startX === "number" &&
                  typeof initialPos.startY === "number" &&
                  typeof initialPos.endX === "number" &&
                  typeof initialPos.endY === "number"
                ) {
                  dispatch(
                    updateShape({
                      id,
                      patch: {
                        startX: initialPos.startX + pending.x,
                        startY: initialPos.startY + pending.y,
                        endX: initialPos.endX + pending.x,
                        endY: initialPos.endY + pending.y,
                      },
                    })
                  );
                }
              } else if (shape.type === "text") {
                if (
                  typeof initialPos.x === "number" &&
                  typeof initialPos.y === "number"
                ) {
                  dispatch(
                    updateShape({
                      id,
                      patch: {
                        x: initialPos.x + pending.x,
                        y: initialPos.y + pending.y,
                      },
                    })
                  );
                }
              }
            }
          });
        });
      }
    }
    if (isSelectingRef.current && selectionMarqueeRef.current) {
      // Update marquee and live-select intersecting shapes
      selectionMarqueeRef.current.currentWorld = world;

      const sx = Math.min(
        selectionMarqueeRef.current.startWorld.x,
        selectionMarqueeRef.current.currentWorld.x
      );
      const sy = Math.min(
        selectionMarqueeRef.current.startWorld.y,
        selectionMarqueeRef.current.currentWorld.y
      );
      const sw = Math.abs(
        selectionMarqueeRef.current.currentWorld.x -
          selectionMarqueeRef.current.startWorld.x
      );
      const sh = Math.abs(
        selectionMarqueeRef.current.currentWorld.y -
          selectionMarqueeRef.current.startWorld.y
      );

      // Helper: does shape intersect marquee rect
      const rectIntersects = (
        ax: number,
        ay: number,
        aw: number,
        ah: number
      ) => {
        return !(ax + aw < sx || ay + ah < sy || ax > sx + sw || ay > sy + sh);
      };

      // Build selection set
      const idsToSelect: string[] = [];
      for (const shape of shapeList) {
        switch (shape.type) {
          case "frame":
          case "rect":
          case "ellipse":
          case "generatedui":
            if (rectIntersects(shape.x, shape.y, shape.w, shape.h))
              idsToSelect.push(shape.id);
            break;
          case "freedraw": {
            if (shape.points.length) {
              const xs = shape.points.map((p: Point) => p.x);
              const ys = shape.points.map((p: Point) => p.y);
              const minX = Math.min(...xs) - 5;
              const minY = Math.min(...ys) - 5;
              const w = Math.max(...xs) - Math.min(...xs) + 10;
              const h = Math.max(...ys) - Math.min(...ys) + 10;
              if (rectIntersects(minX, minY, w, h)) idsToSelect.push(shape.id);
            }
            break;
          }
          case "arrow":
          case "line": {
            const minX = Math.min(shape.startX, shape.endX) - 5;
            const minY = Math.min(shape.startY, shape.endY) - 5;
            const w =
              Math.max(shape.startX, shape.endX) -
              Math.min(shape.startX, shape.endX) +
              10;
            const h =
              Math.max(shape.startY, shape.endY) -
              Math.min(shape.startY, shape.endY) +
              10;
            if (rectIntersects(minX, minY, w, h)) idsToSelect.push(shape.id);
            break;
          }
          case "text": {
            const textWidth =
              Math.max(shape.text.length * (shape.fontSize * 0.6), 100) + 8 + 4;
            const textHeight = shape.fontSize * 1.2 + 4 + 4;
            if (rectIntersects(shape.x - 2, shape.y - 2, textWidth, textHeight))
              idsToSelect.push(shape.id);
            break;
          }
        }
      }

      // Apply selection
      if (!selectionMarqueeRef.current.additive) {
        dispatch(clearSelection());
      }
      for (const id of idsToSelect) dispatch(selectShape(id));
      requestRender();
    }
    if (isDrawingRef.current) {
      if (draftShapeRef.current) {
        draftShapeRef.current.currentWorld = world as Point; // Update the draft shape's current world position
        requestRender(); // Request a render after updating
      } else if (currentTool === "freedraw") {
        // Fixed comparison operator for 'freedraw'
        freeDrawPointsRef.current.push(world); // Add the current world point to the free draw points
      }
    }
  };

  const finalizeDrawingIfAny = (): void => {
    if (!isDrawingRef.current) return; // If not drawing, exit early

    isDrawingRef.current = false; // Mark drawing as finished

    // Cancel freehand drawing animation frame if it exists
    if (freehandRafRef.current) {
      window.cancelAnimationFrame(freehandRafRef.current);
      freehandRafRef.current = null; // Reset the reference
    }

    const draft = draftShapeRef.current; // Get the current draft shape

    if (draft) {
      // Calculate the bounding box for the draft shape
      const x = Math.min(draft.startWorld.x, draft.currentWorld.x);
      const y = Math.min(draft.startWorld.y, draft.currentWorld.y);
      const w = Math.abs(draft.currentWorld.x - draft.startWorld.x); // Fixed the subtraction
      const h = Math.abs(draft.currentWorld.y - draft.startWorld.y); // Fixed the subtraction

      if (w > 1 && h > 1) {
        if (draft.type === "frame") {
          // Use '===' for comparison, not '='
          dispatch(addFrame({ x, y, w, h }));
        } else if (draft.type === "rect") {
          // Corrected comparison operator
          dispatch(addRect({ x, y, w, h }));
        } else if (draft.type === "ellipse") {
          // Corrected comparison operator
          dispatch(addEllipse({ x, y, w, h }));
        } else if (draft.type === "arrow") {
          // Corrected comparison operator
          dispatch(
            addArrow({
              startX: draft.startWorld.x,
              startY: draft.startWorld.y, // Fixed typo in 'starty'
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y, // Fixed typo in 'endy'
            })
          );
        } else if (draft.type === "line") {
          dispatch(
            addLine({
              startX: draft.startWorld.x,
              startY: draft.startWorld.y,
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y,
            })
          );
        }
        dispatch(setTool("select"));
      }
      draftShapeRef.current = null;
    } else if (currentTool === "freedraw") {
      const points = freeDrawPointsRef.current;
      if (points.length > 1) {
        dispatch(addFreeDrawShape({ points }));
      }
      freeDrawPointsRef.current = [];
      dispatch(setTool("select"));
    }
    requestRender();
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    canvasRef.current?.releasePointerCapture?.(e.pointerId);

    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      dispatch(panEnd());
    }

    if (isMovingRef.current) {
      isMovingRef.current = false;
      moveStartRef.current = null;
      initialShapePositionsRef.current = {};
      pendingMoveDeltaRef.current = null;
      if (moveRafRef.current) {
        window.cancelAnimationFrame(moveRafRef.current);
        moveRafRef.current = null;
      }
    }

    if (isErasingRef.current) {
      isErasingRef.current = false;
      erasedShapesRef.current.clear();
    }

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      selectionMarqueeRef.current = null;
      requestRender();
    }

    finalizeDrawingIfAny();
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    onPointerUp(e);
  };

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const ae = document.activeElement as HTMLElement | null;
        // If typing in an input/textarea/contenteditable, do not hijack Space
        if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) {
          return;
        }
        e.preventDefault();
        isSpacePressed.current = true;
        dispatch(handToolEnable());
      }
      if (e.key === "Shift") {
        isShiftPressed.current = true;
      }
      if (e.key === "Delete") {
        const ae = document.activeElement as HTMLElement | null;
        if (
          ae &&
          (ae.tagName === "INPUT" ||
            ae.tagName === "TEXTAREA" ||
            ae.isContentEditable)
        )
          return;
        const ids = Object.keys(selectedShapes);
        if (ids.length) {
          e.preventDefault();
          for (const id of ids) dispatch(removeShape(id));
        }
      }
    },
    [dispatch, selectedShapes]
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) {
          return;
        }
        e.preventDefault();
        isSpacePressed.current = false;
        dispatch(handToolDisable());
      }
      if (e.key === "Shift") {
        isShiftPressed.current = false;
      }
    },
    [dispatch]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      if (freehandRafRef.current) {
        window.cancelAnimationFrame(freehandRafRef.current);
      }
      if (panRafRef.current) {
        window.cancelAnimationFrame(panRafRef.current);
      }
    };
  }, [onKeyDown, onKeyUp]);

  useEffect(() => {
    const handleResizeStart = (e: CustomEvent): void => {
      const { shapeId, corner, bounds } = e.detail;
      isResizingRef.current = true;
      resizeDataRef.current = {
        shapeId,
        corner,
        initialBounds: bounds,
        startPoint: {
          x: e.detail.clientX || 0, // Corrected 'clienty' to 'clientY'
          y: e.detail.clientY || 0, // Corrected 'clienty' to 'clientY'
        },
      };
    };
    const handleResizeMove = (e: CustomEvent): void => {
      // If no resizing is in progress, or no resize data, exit
      if (!isResizingRef.current || !resizeDataRef.current) return;

      // Destructure the relevant data from resizeDataRef and event details
      const { shapeId, corner, initialBounds } = resizeDataRef.current;
      const { clientX, clientY } = e.detail;

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      // Get the canvas's bounding rectangle to adjust coordinates
      const rect = canvasEl.getBoundingClientRect();
      const localX = clientX - rect.left; // Fixed variable names and calculation
      const localY = clientY - rect.top; // Fixed variable names and calculation

      // Now you can use `localX` and `localY` for further logic (e.g., resizing logic)
      const world = screenToWorld(
        { x: localX, y: localY },
        viewport.translate,
        viewport.scale
      );
      const shape = entityState.shapes.entities[shapeId];
      if (!shape) return;
      const newBounds = {
        ...initialBounds,
      };
      switch (corner) {
        case "nw": // Fixed missing closing quote for 'nw'
          newBounds.w = Math.max(
            10,
            initialBounds.w + (initialBounds.x - world.x) // Corrected to subtract for 'nw' (top-left corner)
          );
          newBounds.h = Math.max(
            10,
            initialBounds.h + (initialBounds.y - world.y) // Corrected to subtract for 'nw' (top-left corner)
          );
          newBounds.x = world.x; // Set the new x position based on the world coordinates
          newBounds.y = world.y; // Set the new y position based on the world coordinates
          break;
        case "ne": // Fixed missing closing quote for 'ne'
          newBounds.w = Math.max(10, world.x - initialBounds.x);
          newBounds.h = Math.max(
            10,
            initialBounds.h + (initialBounds.y - world.y)
          );
          newBounds.y = world.y;
          break;
        case "sw": // Fixed missing closing quote for 'sw'
          newBounds.w = Math.max(
            10,
            initialBounds.w + (initialBounds.x - world.x)
          );
          newBounds.h = Math.max(10, world.y - initialBounds.y);
          newBounds.x = world.x;
          break;
        case "se": // Fixed missing closing quote for 'se'
          newBounds.w = Math.max(10, world.x - initialBounds.x);
          newBounds.h = Math.max(10, world.y - initialBounds.y);
          break;
      }

      // If shift is pressed, lock aspect ratio (uniform scale)
      if (isShiftPressed.current) {
        const aspect =
          initialBounds.w > 0 && initialBounds.h > 0
            ? initialBounds.w / initialBounds.h
            : 1;
        // Determine which delta dominates in screen space
        const dw = Math.abs(newBounds.w);
        const dh = Math.abs(newBounds.h);
        if (dw > dh * aspect) {
          // width dominates -> adjust height
          const newH = Math.max(10, Math.round(newBounds.w / (aspect || 1)));
          if (corner === "nw" || corner === "ne") {
            // moving top edge
            const bottom = initialBounds.y + initialBounds.h;
            newBounds.y = bottom - newH;
          }
          newBounds.h = newH;
        } else {
          // height dominates -> adjust width
          const newW = Math.max(10, Math.round(newBounds.h * (aspect || 1)));
          if (corner === "nw" || corner === "sw") {
            // moving left edge
            const right = initialBounds.x + initialBounds.w;
            newBounds.x = right - newW;
          }
          newBounds.w = newW;
        }
      }
      if (
        shape.type === "frame" ||
        shape.type === "rect" ||
        shape.type === "ellipse" ||
        shape.type === "generatedui"
      ) {
        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              x: newBounds.x,
              y: newBounds.y,
              w: newBounds.w,
              h: newBounds.h,
            },
          })
        );
      } else if (shape.type === "freedraw") {
        const xs = shape.points.map((p: { x: number; y: number }) => p.x);
        const ys = shape.points.map((p: { x: number; y: number }) => p.y);

        const actualMinX = Math.min(...xs);
        const actualMaxX = Math.max(...xs);
        const actualMinY = Math.min(...ys);
        const actualMaxY = Math.max(...ys);

        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5;
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10);
        const newActualHeight = Math.max(10, newBounds.h - 10);

        let scaleX = actualWidth > 0 ? newActualWidth / actualWidth : 1;
        let scaleY = actualHeight > 0 ? newActualHeight / actualHeight : 1;
        if (isShiftPressed.current) {
          const s = Math.min(scaleX, scaleY);
          scaleX = s;
          scaleY = s;
        }

        const scaledPoints = shape.points.map(
          (point: { x: number; y: number }) => ({
            x: newActualX + (point.x - actualMinX) * scaleX,
            y: newActualY + (point.y - actualMinY) * scaleY,
          })
        );

        dispatch(updateShape({ id: shapeId, patch: { points: scaledPoints } }));
      } else if (shape.type === "arrow" || shape.type === "line") {
        const actualMinX = Math.min(shape.startX, shape.endX);
        const actualMaxX = Math.max(shape.startX, shape.endX);
        const actualMinY = Math.min(shape.startY, shape.endY);
        const actualMaxY = Math.max(shape.startY, shape.endY);

        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5;
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10);
        const newActualHeight = Math.max(10, newBounds.h - 10);

        let newStartX: number,
          newStartY: number,
          newEndX: number,
          newEndY: number;
        if (actualWidth === 0) {
          newStartX = newActualX + newActualWidth / 2;
          newEndX = newActualX + newActualWidth / 2;
          newStartY =
            shape.startY < shape.endY
              ? newActualY
              : newActualY + newActualHeight;
          newEndY =
            shape.startY < shape.endY
              ? newActualY + newActualHeight
              : newActualY;
        } else if (actualHeight === 0) {
          newEndY = newActualY + newActualHeight / 2;
          newStartX =
            shape.startX < shape.endX
              ? newActualX
              : newActualX + newActualWidth;
          newEndX =
            shape.startX < shape.endX
              ? newActualX + newActualWidth
              : newActualX;
          newStartY = newActualY + newActualHeight / 2;
        } else {
          let scaleX2 = newActualWidth / actualWidth;
          let scaleY2 = newActualHeight / actualHeight;
          if (isShiftPressed.current) {
            const s2 = Math.min(scaleX2, scaleY2);
            scaleX2 = s2;
            scaleY2 = s2;
          }

          newStartX = newActualX + (shape.startX - actualMinX) * scaleX2;
          newStartY = newActualY + (shape.startY - actualMinY) * scaleY2;
          newEndX = newActualX + (shape.endX - actualMinX) * scaleX2;
          newEndY = newActualY + (shape.endY - actualMinY) * scaleY2;
        }

        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              startX: newStartX,
              startY: newStartY,
              endX: newEndX,
              endY: newEndY,
            },
          })
        );
      }
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      resizeDataRef.current = null;
    };

    window.addEventListener(
      "shape-resize-start",
      handleResizeStart as EventListener
    );

    window.addEventListener(
      "shape-resize-move",
      handleResizeMove as EventListener
    );

    window.addEventListener(
      "shape-resize-end",
      handleResizeEnd as EventListener
    );
    return () => {
      window.removeEventListener(
        "shape-resize-start",
        handleResizeStart as EventListener
      );
      window.removeEventListener(
        "shape-resize-move",
        handleResizeMove as EventListener
      );
      window.removeEventListener(
        "shape-resize-end",
        handleResizeEnd as EventListener
      );
    };
  }, [
    dispatch,
    entityState.shapes.entities,
    viewport.translate,
    viewport.scale,
  ]);

  const attachCanvasRef = (ref: HTMLDivElement | null): void => {
    // Clean up any existing event listeners on the old canvas
    if (canvasRef.current) {
      canvasRef.current.removeEventListener("wheel", onWheel);
    }

    // Store the new canvas reference
    canvasRef.current = ref;

    // Add wheel event listener to the new canvas (for zoom/pan)
    if (ref) {
      ref.addEventListener("wheel", onWheel, { passive: false });
    }
  };

  const selectTool = (tool: Tool): void => {
    dispatch(setTool(tool));
  };

  const getDraftShape = (): DraftShape | null => draftShapeRef.current;
  const getFreeDrawPoints = (): ReadonlyArray<Point> =>
    freeDrawPointsRef.current;
  const getSelectionMarquee = () => selectionMarqueeRef.current;

  return {
    viewport,
    shapes: shapeList,
    currentTool,
    selectedShapes,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    attachCanvasRef,
    selectTool,
    getDraftShape,
    getFreeDrawPoints,
    getSelectionMarquee,
    isSidebarOpen,
    hasSelectedText,
  };
};

export const useFrame = (shape: FrameShape) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const allShapes = useAppSelector((state) =>
    Object.values(state.shapes.shapes?.entities || {}).filter(
      (shape): shape is Shape => shape !== undefined
    )
  );

  const handleGenerateDesign = async () => {
    try {
      setIsGenerating(true);
      const snapshot = await generateFrameSnapshot(shape, allShapes);
      downloadBlob(snapshot, `frame-${shape.frameNumber}-snapshot.png`);

      const formData = new FormData();

      // Append the image to the FormData with proper filename formatting
      formData.append("image", snapshot, `frame-${shape.frameNumber}.png`);

      // Append the frame number
      formData.append("frameNumber", shape.frameNumber.toString());

      // Get project ID from URL params (if available)
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project");

      // If the projectId exists in the URL, append it to the FormData
      if (projectId) {
        formData.append("projectId", projectId);
      }
    } catch {}
  };

  return {
    isGenerating,
    handleGenerateDesign,
  };
};
