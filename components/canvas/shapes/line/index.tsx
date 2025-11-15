import { LineShape } from "@/redux/slice/shapes";

export const Line = ({ shape }: { shape: LineShape }) => {
  const { startX, startY, endX, endY } = shape;
  
  // Calculate bounding box for the SVG
  const padding = Math.max(5, (shape.strokeWidth || 1) / 2 + 1);
  const minX = Math.min(startX, endX) - padding;
  const minY = Math.min(startY, endY) - padding;
  const maxX = Math.max(startX, endX) + padding;
  const maxY = Math.max(startY, endY) + padding;
  const width = maxX - minX;
  const height = maxY - minY;
  
  return (
    <svg
      className="absolute pointer-events-none z-10"
      style={{
        left: minX,
        top: minY,
        width,
        height,
      }}
      aria-hidden>
      <line
        x1={startX - minX}
        y1={startY - minY}
        x2={endX - minX}
        y2={endY - minY}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};
