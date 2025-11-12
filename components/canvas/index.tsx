"use client";

import { useInfiniteCanvas, useInspiration } from "@/hooks/use-canvas";
import TextSidebar from "./text-sidebar";
import { cn } from "@/lib/utils";
import ShapeRenderer from "./shapes";
import { RectanglePreview } from "./shapes/rectangle/preview";
import { FramePreview } from "./shapes/frame/preview";
import { ElipsePreview } from "./shapes/elipse/preview";
import { ArrowPreview } from "./shapes/arrow/preview";
import { LinePreview } from "./shapes/line/preview";
import { FreeDrawStrokePreview } from "./shapes/stroke/preview";
import { SelectionOverlay } from "./shapes/selection";
import InspirationSidebar from "./shapes/inspiration-sidebar";

const InfiniteCanvas = () => {
  const {
    viewport,
    shapes,
    currentTool,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    attachCanvasRef,
    getDraftShape,
    getSelectionMarquee,
    isSidebarOpen,
    hasSelectedText,
    getFreeDrawPoints,
    selectedShapes,
  } = useInfiniteCanvas();


  const {isInspirationOpen, closeInspiration, toggleInspiration, exportDesign} = useInspiration()

  const {isChatOpen, activeGeneratedUIId, generateWorkflow} = useGlobalChat()

  const draftShape = getDraftShape();
  const selectionMarquee = getSelectionMarquee?.();
  const freeDrawPoints = getFreeDrawPoints();
  return (
    <>
      <TextSidebar isOpen={isSidebarOpen && hasSelectedText} />
      <InspirationSidebar isOpen={isInspirationOpen} onClose={closeInspiration}/>
      <div
        ref={attachCanvasRef}
        role="application"
        aria-label="Infinite drawing canvas"
        className={cn(
          "relative w-full h-full overflow-hidden select-none z-0",
          {
            "cursor-grabbing": viewport.mode === "panning",
            "cursor-grab": viewport.mode === "shiftPanning",
            "cursor-crosshair":
              currentTool !== "select" && viewport.mode !== "idle",
            "cursor-default":
              currentTool === "select" && viewport.mode === "idle",
          }
        )}
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      >
        <div
          className="absolute origin-top-left pointer-events-none z-10"
          style={{
            transform: `translate3d(${viewport.translate.x}px, ${viewport.translate.y}px, 0) scale(${viewport.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {shapes.map((shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              toggleInspiration={toggleInspiration}
              generateWorkflow={generateWorkflow}
/*               toggleChat={toggleChat}
              
              exportDesign={exportDesign}
 */            />
          ))}

          {shapes.map((shape) => (
            <SelectionOverlay
              key={`selection-${shape.id}`}
              shape={shape}
              isSelected={!!selectedShapes[shape.id]}
            />
          ))}
          {draftShape && draftShape.type === "frame" && (
            <FramePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "rect" && (
            <RectanglePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "ellipse" && (
            <ElipsePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "arrow" && (
            <ArrowPreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "line" && (
            <LinePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {currentTool === "freedraw" && freeDrawPoints.length > 1 && (
            <FreeDrawStrokePreview points={freeDrawPoints} />
          )}
          {selectionMarquee && (
            <div
              className="absolute pointer-events-none border-2 border-blue-400/60 bg-blue-400/10"
              style={{
                left: Math.min(
                  selectionMarquee.startWorld.x,
                  selectionMarquee.currentWorld.x
                ),
                top: Math.min(
                  selectionMarquee.startWorld.y,
                  selectionMarquee.currentWorld.y
                ),
                width: Math.abs(
                  selectionMarquee.currentWorld.x -
                    selectionMarquee.startWorld.x
                ),
                height: Math.abs(
                  selectionMarquee.currentWorld.y -
                    selectionMarquee.startWorld.y
                ),
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default InfiniteCanvas;
