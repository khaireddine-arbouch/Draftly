"use client";
import React, { FormEvent, useState } from "react";
import { useProjectCreation } from "@/hooks/use-project";
import {
  Plus,
  MoreVertical,
  Archive,
  Trash2,
  Pencil,
  Loader2,
  ArchiveRestore,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "@/redux/slice/projects";

type RenameState = {
  open: boolean;
  projectId: string | null;
  value: string;
};

type DeleteState = {
  open: boolean;
  projectId: string | null;
  name: string;
};

export const ProjectsList = () => {
  const {
    projects: projectsState,
    canCreate,
    renameProject,
    archiveProject,
    deleteProject,
  } = useProjectCreation();
  const { user } = useAppSelector((state) => state.profile);
  const profileSlug = user?.name ?? "profile";
  const projects = projectsState as ProjectSummary[];

  const [renameState, setRenameState] = useState<RenameState>({
    open: false,
    projectId: null,
    value: "",
  });
  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    projectId: null,
    name: "",
  });
  const [archiveLoadingId, setArchiveLoadingId] = useState<string | null>(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const renameInputId = "rename-project-name";

  const activeProjects = projects.filter((project) => !project.archived);
  const archivedProjects = projects.filter((project) => project.archived);

  if (!canCreate) {
    return (
      <div className="text-center py-12">
        <p className="text-lg">You are not authorized to create projects</p>
      </div>
    );
  }

  const openRenameDialog = (project: ProjectSummary) => {
    setRenameState({
      open: true,
      projectId: project._id,
      value: project.name ?? "",
    });
  };

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renameState.projectId || !renameState.value.trim()) {
      return;
    }
    setRenameLoading(true);
    try {
      await renameProject(renameState.projectId, renameState.value);
      setRenameState({ open: false, projectId: null, value: "" });
    } finally {
      setRenameLoading(false);
    }
  };

  const handleArchiveToggle = async (project: ProjectSummary) => {
    setArchiveLoadingId(project._id);
    try {
      await archiveProject(project._id, !project.archived);
    } finally {
      setArchiveLoadingId(null);
    }
  };

  const openDeleteDialog = (project: ProjectSummary) => {
    setDeleteState({
      open: true,
      projectId: project._id,
      name: project.name ?? "Untitled project",
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteState.projectId) return;
    setDeleteLoading(true);
    try {
      await deleteProject(deleteState.projectId);
      setDeleteState({ open: false, projectId: null, name: "" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderProjectsGrid = (
    projectList: ProjectSummary[],
    options?: {
      archived?: boolean;
      emptyTitle?: string;
      emptyDescription?: string;
    }
  ) => {
    const { archived = false, emptyTitle, emptyDescription } = options ?? {};
    const fallbackTitle = emptyTitle ?? "No projects yet";
    const fallbackDescription =
      emptyDescription ?? "Create a project to get started.";

    if (projectList.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            {fallbackTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {fallbackDescription}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {projectList.map((project) => {
          const isArchived = archived;
          const href = `/dashboard/${profileSlug}/style-guide?project=${project._id}`;

          return (
            <article
              key={project._id}
              className={`group relative rounded-xl border border-border/60 bg-card p-2 transition hover:border-primary/60 ${isArchived ? "opacity-80" : ""}`}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="absolute right-3 top-3 z-10 rounded-full bg-background/90 p-1 shadow-sm ring-1 ring-border/70 hover:bg-background"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      openRenameDialog(project);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={archiveLoadingId === project._id}
                    onClick={async (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      await handleArchiveToggle(project);
                    }}
                  >
                    {archiveLoadingId === project._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isArchived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    {isArchived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      openDeleteDialog(project);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href={href} className="block space-y-3 rounded-lg p-2">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {project.thumbnail ? (
                    <Image
                      src={project.thumbnail}
                      alt={project.name}
                      width={300}
                      height={200}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                      <Plus className="h-8 w-8 text-muted-foreground/80" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {project.name}
                    </h3>
                    {isArchived && (
                      <Badge variant="outline" className="text-xs uppercase">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Updated {formatDistanceToNow(project.lastModified)} ago
                  </p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Projects
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Your workspace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Rename, archive, or remove projects without leaving this page.
          </p>
        </div>
      </header>

      {activeProjects.length === 0 && archivedProjects.length === 0 ? (
        <div className="text-center py-24">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground">
            No projects yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create your first project to unlock AI-powered canvases, style guides,
            and collaborative flows.
          </p>
        </div>
      ) : (
        <>
          {renderProjectsGrid(activeProjects, {
            emptyTitle:
              archivedProjects.length > 0 ? "No active projects" : undefined,
            emptyDescription:
              archivedProjects.length > 0
                ? "You only have archived projects right now. Create something new to dive back in."
                : undefined,
          })}

          {archivedProjects.length > 0 && (
            <section className="space-y-4 border-t border-border/60 pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    Archived
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Restore archived projects whenever you need them again.
                  </p>
                </div>
                <Badge variant="outline">{archivedProjects.length}</Badge>
              </div>

              {renderProjectsGrid(archivedProjects, { archived: true })}
            </section>
          )}
        </>
      )}

      <Dialog
        open={renameState.open}
        onOpenChange={(open) => {
          if (!open) {
            setRenameState({ open: false, projectId: null, value: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>
              Give your project a clear and descriptive name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor={renameInputId}
                className="text-sm font-medium text-foreground"
              >
                Project name
              </label>
              <Input
                id={renameInputId}
                value={renameState.value}
                onChange={(event) =>
                  setRenameState((prev) => ({ ...prev, value: event.target.value }))
                }
                placeholder="e.g. Onboarding revamp"
                maxLength={64}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setRenameState({ open: false, projectId: null, value: "" })
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!renameState.value.trim() || renameLoading}
                className="gap-2"
              >
                {renameLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false, projectId: null, name: "" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              {`All progress in "${
                deleteState.name || "this project"
              }" will be permanently removed. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading}
              onClick={handleDeleteConfirm}
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
