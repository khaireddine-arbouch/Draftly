"use client";
import { Redo2, Undo2 } from "lucide-react";
import React from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { redo, undo } from "@/redux/slice/shapes";

const HistoryPill = () => {
  const dispatch = useDispatch<AppDispatch>();
  const canUndo = useAppSelector((s) => s.shapes.past.length > 0);
  const canRedo = useAppSelector((s) => s.shapes.future.length > 0);
  return (
    <div className="col-span-1 flex justify-start items-center">
      <div>
        <span
          className="inline-flex items-center rounded-full bg-neutral-900/80 border border-white/16 p-2 text-neutral-300 saturate-150"
        >
          <button
            type="button"
            aria-label="Undo"
            disabled={!canUndo}
            onClick={() => dispatch(undo())}
            className="inline-grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 size={18} className="opacity-80 stroke-[1.75]" />
          </button>
          <span className="mx-1 h-5 w-px rounded bg-white/20" />
          <button
            type="button"
            aria-label="Redo"
            disabled={!canRedo}
            onClick={() => dispatch(redo())}
            className="inline-grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Redo2 size={18} className="opacity-80 stroke-[1.75]" />
          </button>
        </span>
      </div>
    </div>
  );
};

export default HistoryPill;
