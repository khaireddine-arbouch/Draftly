import { FrameShape, updateShape } from "@/redux/slice/shapes";
import { LiquidGlassButton } from "@/components/buttons/liquid-glass/index";
import { Brush, Palette } from "lucide-react";
import { useFrame } from "@/hooks/use-canvas";
import { useAppDispatch } from "@/redux/store";
import { useEffect, useRef, useState } from "react";

export const Frame = ({
  shape,
  toggleInspiration,
}: {
  shape: FrameShape;
  toggleInspiration: () => void;
}) => {
  const { isGenerating, handleGenerateDesign } = useFrame(shape);
  const dispatch = useAppDispatch();
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState<string>(
    shape.name ?? `Frame ${shape.frameNumber}`
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (!isRenaming) {
      setName(shape.name ?? `Frame ${shape.frameNumber}`);
    }
  }, [shape.name, shape.frameNumber, isRenaming]);

  const commitName = () => {
    setIsRenaming(false);
    const trimmed = name.trim();
    dispatch(
      updateShape({
        id: shape.id,
        patch: {
          name: trimmed || undefined,
        },
      })
    );
  };

  const handleLabelDoubleClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  return (
    <>
      <div
        className="absolute pointer-events-none backdrop-blur-xl bg-white/08 border border-white/12 saturate-150"
        style={{
          left: shape.x,
          top: shape.y,
          width: shape.w,
          height: shape.h,
          borderRadius: "12px", // Slightly more rounded for modern feel
        }}
      />
      <div
        className="absolute pointer-events-auto whitespace-nowrap text-xs font-medium text-white/80 select-none"
        style={{
          left: shape.x,
          top: shape.y - 24, // Position above the frame
          fontSize: "11px",
          lineHeight: "1.2",
        }}
        onDoubleClick={handleLabelDoubleClick}
        onClick={(e) => e.stopPropagation()}
      >
        {isRenaming ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitName();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setIsRenaming(false);
                setName(shape.name ?? `Frame ${shape.frameNumber}`);
              }
            }}
            className="bg-transparent border-b border-white/40 text-white/90 outline-none text-xs px-1 py-0.5"
          />
        ) : (
          <span>{shape.name ?? `Frame ${shape.frameNumber}`}</span>
        )}
      </div>
      <div
        className="absolute pointer-events-auto flex gap-4"
        style={{
          left: shape.x + shape.w - 235, // Position at top right, accounting for button width
          top: shape.y - 36, // Position above the frame with some spacing
          zIndex: 1000, // Ensure button is on top
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}>
        <LiquidGlassButton
          size="sm"
          variant="subtle"
          onClick={toggleInspiration}
          style={{ pointerEvents: "auto" }}>
          <Palette size={12} />
          Inspiration
        </LiquidGlassButton>
        <LiquidGlassButton
          size="sm"
          variant="subtle"
          onClick={handleGenerateDesign}
          disabled={isGenerating}
          className={isGenerating ? "animate-pulse" : ""}
          style={{ pointerEvents: "auto" }}>
          <Brush size={12} className={isGenerating ? "animate-spin" : ""} />
          {isGenerating ? "Generating..." : "Generate Design"}
        </LiquidGlassButton>
      </div>
    </>
  );
};
