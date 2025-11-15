import { TextShape } from "@/redux/slice/shapes";
import { useDispatch } from "react-redux";
import { updateShape, removeShape } from "@/redux/slice/shapes";
import { useState, useRef, useEffect } from "react";

export const Text = ({ shape }: { shape: TextShape }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(shape.text === "Type here...");
  const [tempText, setTempText] = useState(shape.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialPlaceholder = useRef(shape.text === "Type here...");

  useEffect(() => {
    if (inputRef.current && isInitialPlaceholder.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Select placeholder text
    }
  }, []);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTempText(shape.text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmedTemp = tempText.trim();
    const trimmedOriginal = shape.text.trim();

    if (
      trimmedOriginal === "Type here..." &&
      (trimmedTemp === "" || trimmedTemp === "Type here...")
    ) {
      // Delete empty or unchanged placeholder text box
      dispatch(removeShape(shape.id));
    } else if (trimmedTemp !== trimmedOriginal) {
      dispatch(
        updateShape({
          id: shape.id,
          patch: { text: trimmedTemp },
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      if (shape.text === "Type here...") {
        // Delete placeholder text box on escape
        dispatch(removeShape(shape.id));
      } else {
        setIsEditing(false);
        setTempText(shape.text);
      }
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="absolute pointer-events-auto bg-transparent outline-none text-white rounded px-2 py-1"
        style={{
          left: shape.x,
          top: shape.y,
          fontSize: shape.fontSize,
          fontFamily: shape.fontFamily,
          fontWeight: shape.fontWeight,
          fontStyle: shape.fontStyle,
          textAlign: shape.textAlign,
          textDecoration: shape.textDecoration,
          lineHeight: shape.lineHeight,
          letterSpacing: shape.letterSpacing,
          textTransform: shape.textTransform,
          color: shape.fill || "#ffffff",
          minWidth: "100px",
          whiteSpace: "nowrap",
        }}
        value={tempText}
        onChange={(e) => setTempText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder=""
        autoComplete="off"
      />
    );
  }

  return (
    <div
      className="absolute pointer-events-auto cursor-move select-none rounded px-2 py-1"
      style={{
        left: shape.x,
        top: shape.y,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        fontWeight: shape.fontWeight,
        fontStyle: shape.fontStyle,
        textAlign: shape.textAlign,
        textDecoration: shape.textDecoration,
        lineHeight: shape.lineHeight,
        letterSpacing: shape.letterSpacing,
        textTransform: shape.textTransform,
        color: shape.fill || "#ffffff",
        userSelect: "none",
        whiteSpace: "nowrap", // Prevent line breaks
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        handleDoubleClick();
      }}
      title="Double-click to edit">
      <span
        className="pointer-events-none"
        style={{ display: "block", minWidth: "20px", minHeight: "1em" }}>
        {shape.text}
      </span>
    </div>
  );
};
