import { LiquidGlassButton } from "@/components/buttons/liquid-glass";
import { useUpdateContainer } from "@/hooks/use-styles";
import { GeneratedUIShape } from "@/redux/slice/shapes";
import { Download, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import React from "react";
import { useAppSelector } from "@/redux/store";

type Props = {
  shape: GeneratedUIShape;
  toggleChat: (generatedUIId: string) => void;
  generateWorkflow: (generatedUIId: string) => void;
  exportDesign: (generatedUIId: string, element: HTMLElement | null) => void;
};

const GeneratedUI: React.FC<Props> = ({
  shape,
  toggleChat,
  generateWorkflow,
  exportDesign,
}) => {
  const { sanitizeHtml, containerRef } = useUpdateContainer(shape);
  const generationStatus =
    useAppSelector(
      (state) => state.shapes.generationStatus[shape.id]
    ) ?? (shape.uiSpecData ? "ready" : "idle");
  const isGenerating = generationStatus === "generating";
  const isReady = generationStatus === "ready";
  const isError = generationStatus === "error";

  const handleExportDesign = () => {
    if (!shape.uiSpecData) {
      console.warn("No UI data to export");
      return;
    }
    // Pass the actual DOM element for snapshot
    exportDesign(shape.id, containerRef.current);
  };

  const handleToggleChat = () => {
    toggleChat(shape.id);
  };

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: "auto", // Auto height to grow with content
      }}
    >
      <div
        className="w-full h-auto relative rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm"
        style={{
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          padding: "16px",
          height: "auto", // Auto height to fit content
          minHeight: "120px", // Minimum height for empty state
          position: "relative", // Contain absolutely positioned elements
        }}
      >
        <div
          className="h-auto w-full"
          style={{
            pointerEvents: "auto",
            height: "auto",
            maxWidth: "100%", // Prevent horizontal overflow
            boxSizing: "border-box", // Include padding in calculations
          }}
        >
          <div className="absolute -top-8 right-0 flex gap-2">
            <LiquidGlassButton
              size="sm"
              variant="subtle"
              onClick={handleExportDesign}
              disabled={!shape.uiSpecData || isGenerating || isError}
              style={{ pointerEvents: "auto" }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Generating...
                </>
              ) : isReady ? (
                <>
                  <Download size={12} />
                  Export
                </>
              ) : isError ? (
                <>
                  <RotateCcw size={12} />
                  Retry
                </>
              ) : (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Preparing...
                </>
              )}
            </LiquidGlassButton>

            <LiquidGlassButton
              size="sm"
              variant="subtle"
              onClick={handleToggleChat}
              disabled={!shape.uiSpecData || isGenerating}
              style={{ pointerEvents: "auto" }}
            >
              <MessageCircle size={12} />
              Design Chat
            </LiquidGlassButton>
          </div>
          {isError ? (
            <div className="flex items-center justify-center p-8 text-red-400 text-sm font-medium gap-2">
              <RotateCcw size={14} />
              Generation failed. Try again.
            </div>
          ) : shape.uiSpecData ? (
            <div
              className="h-auto"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(shape.uiSpecData),
              }}
            />
          ) : (
            <div className="flex items-center justify-center p-8 text-white/60">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating design...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className="absolute -top-6 left-0 text-xs px-2 py-1 rounded whitespace-nowrap text-white/60 bg-black/40"
        style={{ fontSize: "10px" }}
      >
        Generated UI
      </div>
    </div>
  );
};

export default GeneratedUI;
