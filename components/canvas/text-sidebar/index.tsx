"use client";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { TextShape, updateShape } from "@/redux/slice/shapes";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Palette,
  Strikethrough,
  Underline,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  isOpen: boolean;
};
const TextSidebar = ({ isOpen }: Props) => {
  const dispatch = useAppDispatch();
  const selectedShapes = useAppSelector((state) => state.shapes.selected);
  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities
  );

  // TODO: remove isOpen
  const selectedTextShape = Object.keys(selectedShapes)
    .map((id) => shapesEntities[id])
    .find((shape) => shape?.type === "text") as TextShape | undefined;

  const updateTextProperty = <K extends keyof TextShape>(
    property: K,
    value: TextShape[K]
  ) => {
    if (!selectedTextShape) return;
    dispatch(
      updateShape({
        id: selectedTextShape.id,
        patch: { [property]: value },
      })
    );
  };

  const [colorInput, setColorInput] = useState(
    selectedTextShape?.fill || "#ffffff"
  );

  const fontFamilies = [
    "Inter, sans-serif",
    "Roboto, sans-serif",
    "Helvetica, sans-serif",
    "Arial, sans-serif",
    "Verdana, sans-serif",
  ];

  // Handle color change with validation
  const handleColorChange = (color: string) => {
    setColorInput(color);
    if (/^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color)) {
      updateTextProperty("fill", color);
    }
  };

  if (!isOpen || !selectedTextShape) return null;

  return (
    <div
      key={selectedTextShape.id}
      className={cn(
        "fixed right-5 top-1/2 transform -translate-y-1/2 w-80 backdrop-blur-xl bg-white/8 border-white/12 gap-2 p-3 saturate-150 border rounded-lg z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="p-4 flex flex-col gap-10 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div className="space-y-2">
          <Label className="text-white/80">Font Family</Label>
          <Select
            value={selectedTextShape.fontFamily}
            onValueChange={(value) => updateTextProperty("fontFamily", value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10 w-full text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10">
              {fontFamilies.map((font) => (
                <SelectItem
                  key={font}
                  value={font}
                  className="text-white hover:bg-white/10"
                >
                  <span style={{ fontFamily: font }}>{font.split(",")[0]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">
            Font Size: {selectedTextShape?.fontSize}px
          </Label>
          <Slider
            value={[selectedTextShape?.fontSize]}
            onValueChange={(value) => updateTextProperty("fontSize", value[0])}
            min={8}
            max={128}
            step={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">
            Font Weight: {selectedTextShape?.fontWeight}
          </Label>
          <Slider
            value={[selectedTextShape?.fontWeight]}
            onValueChange={(value) => updateTextProperty("fontWeight", value[0])}
            min={100}
            max={900}
            step={100}
            className="w-full"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-white/80">Style</Label>
          <div className="flex gap-2">
            <Toggle
              pressed={selectedTextShape.fontWeight >= 600}
              onPressedChange={(pressed) =>
                updateTextProperty("fontWeight", pressed ? 700 : 400)
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Bold className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.fontStyle === "italic"}
              onPressedChange={(pressed) =>
                updateTextProperty("fontStyle", pressed ? "italic" : "normal")
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Italic className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.textDecoration === "underline"}
              onPressedChange={(pressed) =>
                updateTextProperty(
                  "textDecoration",
                  pressed ? "underline" : "none"
                )
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Underline className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.textDecoration === "line-through"}
              onPressedChange={(pressed) =>
                updateTextProperty(
                  "textDecoration",
                  pressed ? "line-through" : "none"
                )
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Strikethrough className="w-4 h-4" />
            </Toggle>
          </div>
          <div className="flex gap-2"></div>
        </div>
        {/* Alignment */}
        <div className="space-y-3">
          <Label className="text-white/80">Alignment</Label>
          <div className="flex gap-2">
            <Toggle
              pressed={selectedTextShape.textAlign === "left"}
              onPressedChange={() => updateTextProperty("textAlign", "left")}
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <AlignLeft className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.textAlign === "center"}
              onPressedChange={() => updateTextProperty("textAlign", "center")}
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <AlignCenter className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.textAlign === "right"}
              onPressedChange={() => updateTextProperty("textAlign", "right")}
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <AlignRight className="w-4 h-4" />
            </Toggle>
          </div>
        </div>
        {/* Text content */}
        <div className="space-y-2">
          <Label className="text-white/80">Text</Label>
          <Textarea
            value={selectedTextShape.text}
            onChange={(e) => updateTextProperty("text", e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Type here..."
          />
        </div>
        {/* Line height */}
        <div className="space-y-2">
          <Label className="text-white/80">Line Height: {selectedTextShape.lineHeight.toFixed(2)}</Label>
          <Slider
            value={[selectedTextShape.lineHeight]}
            onValueChange={(value) => updateTextProperty("lineHeight", Number(value[0]))}
            min={0.8}
            max={3}
            step={0.05}
            className="w-full"
          />
        </div>
        {/* Letter spacing */}
        <div className="space-y-2">
          <Label className="text-white/80">Letter Spacing: {selectedTextShape.letterSpacing.toFixed(2)}px</Label>
          <Slider
            value={[selectedTextShape.letterSpacing]}
            onValueChange={(value) => updateTextProperty("letterSpacing", Number(value[0]))}
            min={-2}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>
        {/* Text transform */}
        <div className="space-y-2">
          <Label className="text-white/80">Text Transform</Label>
          <Select
            value={selectedTextShape.textTransform}
            onValueChange={(v) => updateTextProperty("textTransform", v as TextShape["textTransform"])}
          >
            <SelectTrigger className="bg-white/5 border-white/10 w-full text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10">
              <SelectItem value="none" className="text-white hover:bg-white/10">None</SelectItem>
              <SelectItem value="uppercase" className="text-white hover:bg-white/10">Uppercase</SelectItem>
              <SelectItem value="lowercase" className="text-white hover:bg-white/10">Lowercase</SelectItem>
              <SelectItem value="capitalize" className="text-white hover:bg-white/10">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Text picker */}
        <div className="space-y-2">
          <Label className="text-white/80 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Text Color
          </Label>
          <div className="flex gap-2">
            <Input
              value={colorInput}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#ffffff"
              className="bg-white/5 border-white/10 text-white flex-1"
            />
            <div
              className="w-10 h-10 rounded border border-white/20 cursor-pointer"
              style={{ backgroundColor: selectedTextShape.fill || "#ffffff" }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "color";
                input.value = selectedTextShape.fill || "#ffffff";
                input.onchange = (e) => {
                  const color = (e.target as HTMLInputElement).value;
                  setColorInput(color);
                  updateTextProperty("fill", color);
                };
                input.click();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextSidebar;
