"use client";
import { loadProject } from '@/redux/slice/shapes';
import { restoreViewport } from '@/redux/slice/viewport';
import { useAppDispatch } from '@/redux/store';
import React, { useEffect, useRef } from 'react';

export interface ProjectData {
  id?: string | number;
  sketchesData?: Parameters<typeof loadProject>[0];
  viewportData?: Parameters<typeof restoreViewport>[0];
  lastModified?: number;
}

type Props = {
  children: React.ReactNode;
  initialProject?: ProjectData | null;
};

const ProjectProvider: React.FC<Props> = ({ children, initialProject }) => {
  const dispatch = useAppDispatch();
  const hasLoadedProjectRef = useRef(false);
  const loadedProjectKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const projectData = initialProject;

    if (!projectData?.sketchesData) {
      return;
    }

    const projectKey =
      projectData?.id != null
        ? String(projectData.id)
        : projectData?.sketchesData
        ? JSON.stringify(projectData.sketchesData)
        : "no-sketches";

    if (hasLoadedProjectRef.current && loadedProjectKeyRef.current === projectKey) {
      return;
    }

    // Prefer the most recent state between server and local backup
    let loadedFromBackup = false;
    try {
      if (projectData?.id != null && typeof window !== 'undefined' && 'localStorage' in window) {
        const key = `draftly:autosave:${String(projectData.id)}`;
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            shapes?: Parameters<typeof loadProject>[0];
            viewport?: Parameters<typeof restoreViewport>[0];
            ts?: number;
            stateString?: string;
          };
          const serverLastModified =
            typeof projectData.lastModified === 'number' ? projectData.lastModified : 0;
          const backupTs = typeof parsed?.ts === 'number' ? parsed.ts : 0;

          // Only use backup if it's at least as recent as the server copy
          if (parsed?.shapes && backupTs >= serverLastModified) {
            dispatch(loadProject(parsed.shapes));
            if (parsed?.viewport) {
              dispatch(restoreViewport(parsed.viewport));
            } else if (projectData.viewportData) {
              dispatch(restoreViewport(projectData.viewportData));
            }
            loadedFromBackup = true;
          }
        }
      }
    } catch {
      // ignore malformed local backups
    }

    if (!loadedFromBackup) {
      dispatch(loadProject(projectData.sketchesData));
      if (projectData.viewportData) {
        dispatch(restoreViewport(projectData.viewportData));
      }
    }

    hasLoadedProjectRef.current = true;
    loadedProjectKeyRef.current = projectKey;
  }, [dispatch, initialProject]);

  return <>{children}</>;
};

export default ProjectProvider;
