"use client";
import { Button } from "@/components/ui/button";
import { useInfiniteCanvas } from "@/hooks/use-canvas";
import { setScale, zoomBy } from "@/redux/slice/viewport";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useDispatch } from "react-redux";
import React from "react";

const ZoomBar = () => {
  const { viewport } = useInfiniteCanvas();
  const dispatch = useDispatch();

  const handleZoomOut = () => {
    const originScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    dispatch(zoomBy({ factor: 1 / 1.2, originScreen }));
  };

  const handleZoomIn = () => {
    const originScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    dispatch(zoomBy({ factor: 1.2, originScreen }));
  };

  return (
    <div className="col-span-1 flex justify-end items-center">
      <div className="flex items-center gap-1 bg-neutral-900/80 border border-white/16 rounded-full p-3 saturate-150">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-neutral-800 border border-transparent hover:border-white/20 transition-all pointer-events-auto"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-primary/50" />
        </Button>
        <div className="text-center">
          <span className="text-sm font-mono leading-none text-primary/50">{Math.round(viewport.scale * 100)}%</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-neutral-800 border border-transparent hover:border-white/20 transition-all pointer-events-auto"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-primary/50" />
        </Button>
      </div>
    </div>
  );
};

export default ZoomBar;
