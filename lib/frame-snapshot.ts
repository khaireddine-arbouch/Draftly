import { FrameShape, Shape } from "@/redux/slice/shapes";

export const isShapeInsideFrame = (
  shape: Shape,
  frame: FrameShape
): boolean => {
  const frameLeft = frame.x;
  const frameTop = frame.y;
  const frameRight = frame.x + frame.w;
  const frameBottom = frame.y + frame.h;

  switch (shape.type) {
    case "rect":
    case "ellipse":
    case "frame":
      // Check if shape center point is within frame
      const centerX = shape.x + shape.w / 2;
      const centerY = shape.y + shape.h / 2;
      return (
        centerX >= frameLeft &&
        centerX <= frameRight &&
        centerY >= frameTop &&
        centerY <= frameBottom
      );

    case "text":
      // Check if text position is within frame
      return (
        shape.x >= frameLeft &&
        shape.x <= frameRight &&
        shape.y >= frameTop &&
        shape.y <= frameBottom
      );

    case "freedraw":
      // Check if any drawing points are within frame
      return shape.points.some(
        (point) =>
          point.x >= frameLeft &&
          point.x <= frameRight &&
          point.y >= frameTop &&
          point.y <= frameBottom
      );

    case "line":
    case "arrow":
      // Check if either start or end point is within frame
      const startInside =
        shape.startX >= frameLeft &&
        shape.startX <= frameRight &&
        shape.startY >= frameTop &&
        shape.startY <= frameBottom;
      const endInside =
        shape.endX >= frameLeft &&
        shape.endX <= frameRight &&
        shape.endY >= frameTop &&
        shape.endY <= frameBottom;
      return startInside || endInside;

    default:
      return false;
  }
};

export const getShapesInsideFrame = (
  shapes: Shape[],
  frame: FrameShape
): Shape[] => {
  const shapesInFrame = shapes.filter(
    (shape) => shape.id !== frame.id && isShapeInsideFrame(shape, frame)
  );
  return shapesInFrame;
};

const renderShapeOnCanvas = (
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  frameX: number,
  frameY: number
) => {
  ctx.save();

  switch (shape.type) {
    case "rect":
    case "ellipse":
    case "frame":
      const relativeX = shape.x - frameX;
      const relativeY = shape.y - frameY;

      if (shape.type === "rect" || shape.type === "frame") {
        ctx.strokeStyle =
          shape.stroke && shape.stroke !== "transparent"
            ? shape.stroke
            : "#ffffff";
        ctx.lineWidth = shape.strokeWidth || 2;
        const borderRadius = shape.type === "rect" ? 8 : 0;

        ctx.beginPath();
        ctx.moveTo(relativeX + borderRadius, relativeY);
        ctx.lineTo(relativeX + shape.w - borderRadius, relativeY);
        ctx.quadraticCurveTo(
          relativeX + shape.w,
          relativeY,
          relativeX + shape.w,
          relativeY + borderRadius
        );
        ctx.lineTo(relativeX + shape.w, relativeY + shape.h - borderRadius);
        ctx.quadraticCurveTo(
          relativeX + shape.w,
          relativeY + shape.h,
          relativeX + shape.w - borderRadius,
          relativeY + shape.h
        );
        ctx.lineTo(relativeX + borderRadius, relativeY + shape.h);
        ctx.quadraticCurveTo(
          relativeX,
          relativeY + shape.h,
          relativeX,
          relativeY + shape.h - borderRadius
        );
        ctx.lineTo(relativeX, relativeY + borderRadius);
        ctx.quadraticCurveTo(
          relativeX,
          relativeY,
          relativeX + borderRadius,
          relativeY
        );
        ctx.closePath();
        ctx.stroke();
      } else if (shape.type === "ellipse") {
        ctx.strokeStyle =
          shape.stroke && shape.stroke !== "transparent"
            ? shape.stroke
            : "#000";
        ctx.lineWidth = shape.strokeWidth || 2;

        ctx.beginPath();
        ctx.ellipse(
          relativeX + shape.w / 2,
          relativeY + shape.h / 2,
          shape.w / 2,
          shape.h / 2,
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      }
      break;

    case "text":
      const textRelativeX = shape.x - frameX;
      const textRelativeY = shape.y - frameY;

      ctx.fillStyle = shape.fill || "#ffffff";
      ctx.font = `${shape.fontSize}px ${
        shape.fontFamily || "Inter, sans-serif"
      }`;
      ctx.textBaseline = "top";
      ctx.fillText(shape.text, textRelativeX, textRelativeY);
      break;

    case "freedraw":
      if (shape.points.length > 1) {
        ctx.strokeStyle = shape.stroke || "#ffffff";
        ctx.lineWidth = shape.strokeWidth || 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        const firstPoint = shape.points[0];
        ctx.moveTo(firstPoint.x - frameX, firstPoint.y - frameY);
        for (let i = 1; i < shape.points.length; i++) {
          const point = shape.points[i];
          ctx.lineTo(point.x - frameX, point.y - frameY);
        }
        ctx.stroke();
      }
      break;

    case "line":
      ctx.strokeStyle = shape.stroke || "#ffffff";
      ctx.lineWidth = shape.strokeWidth || 2;

      ctx.beginPath();
      ctx.moveTo(shape.startX - frameX, shape.startY - frameY);
      ctx.lineTo(shape.endX - frameX, shape.endY - frameY);
      ctx.stroke();
      break;

    case "arrow":
      ctx.strokeStyle = shape.stroke || "#ffffff";
      ctx.lineWidth = shape.strokeWidth || 2;

      ctx.beginPath();
      ctx.moveTo(shape.startX - frameX, shape.startY - frameY);
      ctx.lineTo(shape.endX - frameX, shape.endY - frameY);
      ctx.stroke();

      const headLength = 10;
      const angle = Math.atan2(
        shape.endY - shape.startY,
        shape.endX - shape.startX
      );
      ctx.fillStyle = shape.stroke || "#ffffff";

      ctx.beginPath();
      ctx.moveTo(shape.endX - frameX, shape.endY - frameY);
      ctx.lineTo(
        shape.endX - frameX - headLength * Math.cos(angle - Math.PI / 6),
        shape.endY - frameY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        shape.endX - frameX - headLength * Math.cos(angle + Math.PI / 6),
        shape.endY - frameY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
};

export const generateFrameSnapshot = async (
  frame: FrameShape,
  allShapes: Shape[]
): Promise<Blob> => {
  // Get the shapes that are inside the frame
  const shapesInFrame = getShapesInsideFrame(allShapes, frame);

  // Create a canvas and set its width and height based on the frame dimensions
  const canvas = document.createElement("canvas");
  canvas.width = frame.w;
  canvas.height = frame.h;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill the canvas background with black (or any color of your choice)
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Save the canvas state before clipping
  ctx.save();

  // Clip to the area of the frame
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.clip();

  // Render each shape inside the frame
  shapesInFrame.forEach((shape) => {
    renderShapeOnCanvas(ctx, shape, frame.x, frame.y);
  });

  // Restore the canvas state
  ctx.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob); // Resolve with the blob if successful
        } else {
          reject(new Error("Failed to create image blob")); // Reject if no blob is created
        }
      },
      "image/png",
      1.0 // Quality setting (only applies to some formats like JPEG, not PNG)
    );
  });
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob); // Create a URL for the Blob
  const link = document.createElement("a"); // Create a hidden <a> element
  link.href = url; // Set the href to the Blob URL
  link.download = filename; // Set the download attribute to the desired filename

  // Append the link to the document body (required for Firefox)
  document.body.appendChild(link);

  // Trigger the download by simulating a click
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

  // Revoke the object URL to free up memory
  URL.revokeObjectURL(url);
};

const captureVisualContent = async (
  ctx: CanvasRenderingContext2D,
  contentDiv: HTMLElement,
  width: number,
  height: number
) => {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(contentDiv, {
    width: width,
    height: height,
    backgroundColor: "#ffffff",
    pixelRatio: 1,
    cacheBust: true,
    includeQueryParams: false,
    skipAutoScale: true,
    skipFonts: true,
    filter: (node) => {
      if (node.nodeType === Node.TEXT_NODE) return true;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        return ![
          "SCRIPT",
          "STYLE",
          "BUTTON",
          "INPUT",
          "SELECT",
          "TEXTAREA",
        ].includes(element.tagName);
      }
      return true;
    },
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      console.log("✔ Visual content captured successfully");
      resolve();
    };
    img.onerror = () => {
      reject(new Error("Failed to load captured image"));
    };
    img.src = dataUrl;
  });
};

export const exportGeneratedUIASPNG = async (
  element: HTMLElement,
  filename: string
) => {
  try {
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const contentDiv = element.querySelector(
      'div [style*="pointer-events: auto"]'
    ) as HTMLElement;

    if (contentDiv) {
      console.log("Found content div, capturing visual content");
      await captureVisualContent(ctx, contentDiv, rect.width, rect.height);
    } else {
      throw new Error("No content div found to capture visual content");
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log("✔ GeneratedUI snapshot created successfully:", {
            size: blob.size,
            type: blob.type,
            filename,
          });
          downloadBlob(blob, filename);
        } else {
          console.error("X Failed to create GeneratedUI snapshot blob");
        }
      },
      "image/png",
      1.0
    );
  } catch (error) {
    console.error("❌ Failed to capture GeneratedUI snapshot:", error);

    // Import toast dynamically to avoid circular dependencies
    const { toast } = await import("sonner");

    toast.error("Failed to export design. Please try again.");
    throw error;
  }
};
