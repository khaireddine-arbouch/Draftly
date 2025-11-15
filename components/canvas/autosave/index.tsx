"use client";

import { useAutosaveProjectMutation } from "@/redux/api/project";
import { useAppSelector } from "@/redux/store";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";
import { generateProjectThumbnail } from "@/lib/project-thumbnail";
import type { Shape } from "@/redux/slice/shapes";

const Autosave = () => {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const user = useAppSelector((state) => state.profile.user);
  const shapesState = useAppSelector((state) => state.shapes);
  const [autosaveProject, { isLoading: isSaving }] =
    useAutosaveProjectMutation();
  const viewportState = useAppSelector((state) => state.viewport);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const localKeyRef = useRef<string | null>(null);
  const lastThumbnailRef = useRef<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const isReady = Boolean(projectId && user?.id);

  useEffect(() => {
    if (!projectId) return;
    localKeyRef.current = `draftly:autosave:${projectId}`;
  }, [projectId]);

  const writeLocalBackup = React.useCallback((payload: {
    shapes: typeof shapesState;
    viewport: typeof viewportState;
    stateString: string;
  }) => {
    try {
      const key = localKeyRef.current;
      if (!key) return;
      const snapshot = {
        shapes: payload.shapes,
        viewport: payload.viewport,
        ts: Date.now(),
        stateString: payload.stateString,
      };
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // ignore quota or serialization errors
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const stateString = JSON.stringify({
      shapes: shapesState,
      viewport: viewportState,
    });

    if (stateString === lastSavedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();

      abortRef.current = new AbortController();
      setSaveStatus("saving");

      try {
        // Always keep a local backup to survive refresh even if server fails
        writeLocalBackup({
          shapes: shapesState,
          viewport: viewportState,
          stateString,
        });

        let thumbnail: string | undefined;
        try {
          const shapes = Object.values(shapesState.shapes.entities).filter(
            (shape): shape is Shape => Boolean(shape)
          );
          if (shapes.length) {
            const preview = await generateProjectThumbnail(shapes);
            if (preview && preview !== lastThumbnailRef.current) {
              thumbnail = preview;
              lastThumbnailRef.current = preview;
            }
          } else {
            lastThumbnailRef.current = null;
          }
        } catch (thumbnailError) {
          console.warn("[autosave] Failed to generate thumbnail", thumbnailError);
        }

        await autosaveProject({
          projectId: projectId as string,
          userId: user?.id as string,
          shapesData: shapesState,
          viewportData: {
            scale: viewportState.scale,
            translate: viewportState.translate,
          },
          thumbnail,
        }).unwrap();
        lastSavedRef.current = stateString;
        setSaveStatus("saved");
        if (successResetRef.current) clearTimeout(successResetRef.current);
        successResetRef.current = setTimeout(() => {
          setSaveStatus("idle");
          successResetRef.current = null;
        }, 2000);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setSaveStatus("error");
        if (errorResetRef.current) clearTimeout(errorResetRef.current);
        errorResetRef.current = setTimeout(() => {
          setSaveStatus("idle");
          errorResetRef.current = null;
        }, 3000);
      }

      // You can add your async logic here (e.g., autosave call)
    }, 1000); // Adjust the debounce delay as needed
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (successResetRef.current) {
        clearTimeout(successResetRef.current);
        successResetRef.current = null;
      }
      if (errorResetRef.current) {
        clearTimeout(errorResetRef.current);
        errorResetRef.current = null;
      }
    };
  }, [isReady, shapesState, viewportState, projectId, user?.id, autosaveProject, writeLocalBackup]);

  // As a last line of defense, backup on unload
  useEffect(() => {
    if (!isReady) return;
    const handler = () => {
      const stateString = JSON.stringify({
        shapes: shapesState,
        viewport: viewportState,
      });
      writeLocalBackup({
        shapes: shapesState,
        viewport: viewportState,
        stateString,
      });
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isReady, shapesState, viewportState, writeLocalBackup]);


  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (successResetRef.current) {
        clearTimeout(successResetRef.current);
        successResetRef.current = null;
      }
      if (errorResetRef.current) {
        clearTimeout(errorResetRef.current);
        errorResetRef.current = null;
      }
    };

  }, []);

  if(!isReady) return null;
  if(isSaving) return (
    <div className="flex items-center">
        <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );
  switch (saveStatus) {
    case "saved":
      return (
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4" />
        </div>
      );
    case "error":
      return (
        <div className="flex items-center">
          <AlertCircle className="w-4 h-4" />
        </div>
      );
    default:
      return <></>;
  }
};

export default Autosave;
