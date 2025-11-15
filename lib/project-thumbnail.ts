import type { Shape, FrameShape } from "@/redux/slice/shapes";

type ThumbnailOptions = {
  width?: number;
  height?: number;
  background?: string;
  accent?: string;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const DEFAULTS = {
  width: 320,
  height: 200,
  padding: 16,
  background: "#05070b",
  accent: "rgba(255,255,255,0.08)",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getShapeBounds = (shape: Shape): Bounds | null => {
  switch (shape.type) {
    case "rect":
    case "ellipse":
    case "frame":
    case "generatedui":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.w,
        maxY: shape.y + shape.h,
      };
    case "text":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + Math.max(40, shape.text.length * 10),
        maxY: shape.y + shape.fontSize * 1.2,
      };
    case "freedraw": {
      if (!shape.points.length) return null;
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      };
    }
    case "line":
    case "arrow":
      return {
        minX: Math.min(shape.startX, shape.endX),
        minY: Math.min(shape.startY, shape.endY),
        maxX: Math.max(shape.startX, shape.endX),
        maxY: Math.max(shape.startY, shape.endY),
      };
    default:
      return null;
  }
};

const mergeBounds = (bounds: Bounds[]): Bounds | null => {
  if (!bounds.length) return null;
  return bounds.reduce(
    (acc, b) => ({
      minX: Math.min(acc.minX, b.minX),
      minY: Math.min(acc.minY, b.minY),
      maxX: Math.max(acc.maxX, b.maxX),
      maxY: Math.max(acc.maxY, b.maxY),
    }),
    bounds[0]
  );
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawShape = (
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  translateX: number,
  translateY: number,
  scale: number
) => {
  ctx.save();

  const colorStroke =
    shape.stroke && shape.stroke !== "transparent"
      ? shape.stroke
      : "rgba(255,255,255,0.7)";
  const colorFill =
    shape.fill && shape.fill !== "transparent"
      ? shape.fill
      : "rgba(255,255,255,0.04)";

  switch (shape.type) {
    case "frame": {
      const x = (shape.x + translateX) * scale;
      const y = (shape.y + translateY) * scale;
      const w = Math.max(shape.w * scale, 2);
      const h = Math.max(shape.h * scale, 2);
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
      const label = shape.name || `Frame ${shape.frameNumber}`;
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = `${clamp(12 * scale, 10, 18)}px 'Inter', sans-serif`;
      ctx.fillText(label, x + 8, y + 16);
      break;
    }
    case "rect":
    case "generatedui": {
      const x = (shape.x + translateX) * scale;
      const y = (shape.y + translateY) * scale;
      const w = Math.max(shape.w * scale, 2);
      const h = Math.max(shape.h * scale, 2);
      ctx.fillStyle = colorFill;
      ctx.strokeStyle = colorStroke;
      ctx.lineWidth = Math.max(shape.strokeWidth * scale, 1);
      drawRoundedRect(ctx, x, y, w, h, 6);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "ellipse": {
      const x = (shape.x + translateX) * scale;
      const y = (shape.y + translateY) * scale;
      const w = Math.max(shape.w * scale, 2);
      const h = Math.max(shape.h * scale, 2);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
      ctx.fillStyle = colorFill;
      ctx.fill();
      ctx.lineWidth = Math.max(shape.strokeWidth * scale, 1);
      ctx.strokeStyle = colorStroke;
      ctx.stroke();
      break;
    }
    case "text": {
      const x = (shape.x + translateX) * scale;
      const y = (shape.y + translateY) * scale;
      const fontSize = clamp(shape.fontSize * scale, 10, 28);
      ctx.fillStyle = shape.fill || "rgba(255,255,255,0.9)";
      ctx.font = `${shape.fontStyle ?? "normal"} ${clamp(
        fontSize,
        10,
        28
      )}px ${shape.fontFamily ?? "Inter, sans-serif"}`;
      ctx.textBaseline = "top";
      ctx.fillText(shape.text, x, y);
      break;
    }
    case "freedraw": {
      if (shape.points.length < 2) break;
      ctx.beginPath();
      ctx.lineWidth = Math.max(shape.strokeWidth * scale, 1.2);
      ctx.strokeStyle = colorStroke;
      const first = shape.points[0];
      ctx.moveTo((first.x + translateX) * scale, (first.y + translateY) * scale);
      for (let i = 1; i < shape.points.length; i++) {
        const point = shape.points[i];
        ctx.lineTo(
          (point.x + translateX) * scale,
          (point.y + translateY) * scale
        );
      }
      ctx.stroke();
      break;
    }
    case "line":
    case "arrow": {
      ctx.beginPath();
      ctx.lineWidth = Math.max(shape.strokeWidth * scale, 1.5);
      ctx.strokeStyle = colorStroke;
      ctx.moveTo(
        (shape.startX + translateX) * scale,
        (shape.startY + translateY) * scale
      );
      ctx.lineTo(
        (shape.endX + translateX) * scale,
        (shape.endY + translateY) * scale
      );
      ctx.stroke();
      if (shape.type === "arrow") {
        const angle = Math.atan2(
          shape.endY - shape.startY,
          shape.endX - shape.startX
        );
        const headLength = 10 * scale;
        ctx.fillStyle = colorStroke;
        ctx.beginPath();
        ctx.moveTo(
          (shape.endX + translateX) * scale,
          (shape.endY + translateY) * scale
        );
        ctx.lineTo(
          (shape.endX + translateX) * scale -
            headLength * Math.cos(angle - Math.PI / 6),
          (shape.endY + translateY) * scale -
            headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          (shape.endX + translateX) * scale -
            headLength * Math.cos(angle + Math.PI / 6),
          (shape.endY + translateY) * scale -
            headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    default:
      break;
  }

  ctx.restore();
};

const highlightPrimaryFrame = (
  shapes: Shape[]
): FrameShape | undefined => {
  return shapes
    .filter((shape): shape is FrameShape => shape?.type === "frame")
    .sort((a, b) => a.frameNumber - b.frameNumber)[0];
};

export const generateProjectThumbnail = async (
  shapes: Shape[],
  options?: ThumbnailOptions
): Promise<string | null> => {
  if (typeof document === "undefined") return null;

  const shapeList = shapes.filter(Boolean);
  if (!shapeList.length) return null;

  const boundsList = shapeList
    .map(getShapeBounds)
    .filter((b): b is Bounds => Boolean(b));
  const mergedBounds = mergeBounds(boundsList);
  if (!mergedBounds) return null;

  const width = options?.width ?? DEFAULTS.width;
  const height = options?.height ?? DEFAULTS.height;
  const padding = DEFAULTS.padding;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  const contentWidth = Math.max(mergedBounds.maxX - mergedBounds.minX, 1);
  const contentHeight = Math.max(mergedBounds.maxY - mergedBounds.minY, 1);

  const scale = Math.min(
    availableWidth / contentWidth,
    availableHeight / contentHeight,
    2
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = options?.background ?? DEFAULTS.background;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const accent = options?.accent ?? DEFAULTS.accent;
  ctx.fillStyle = accent;
  ctx.filter = "blur(24px)";
  ctx.fillRect(width * 0.1, height * 0.2, width * 0.8, height * 0.6);
  ctx.filter = "none";

  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const offsetX = (width - scaledWidth) / 2;
  const offsetY = (height - scaledHeight) / 2;
  const translateX = -mergedBounds.minX + offsetX / scale;
  const translateY = -mergedBounds.minY + offsetY / scale;

  const primaryFrame = highlightPrimaryFrame(shapeList);

  if (primaryFrame) {
    drawShape(ctx, primaryFrame, translateX, translateY, scale);
  }

  shapeList.forEach((shape) => {
    if (shape === primaryFrame) return;
    drawShape(ctx, shape, translateX, translateY, scale);
  });

  return canvas.toDataURL("image/png", 0.92);
};

