"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { CircleQuestionMark, Hash, LayoutTemplate, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { Profile } from "@/types/user";
import CreateProject from "./buttons/project";
import Autosave from "./canvas/autosave";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useRef, ChangeEvent } from "react";
import { toast } from "sonner";
import { setProfile } from "@/redux/slice/profile";

type TabProps = {
  label: string;
  href: string;
  path: string;
  icon?: React.ReactNode;
};

export function Navbar() {
  const params = useSearchParams();
  const projectId = params.get("project");
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { signOut } = useAuthActions();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const me = useAppSelector((state) => state.profile.user as Profile | null);

  // Check if user is authenticated
  const currentUser = useQuery(api.user.getCurrentUser, {});

  // Derive the session segment from the current pathname (e.g. /dashboard/{session}/...)
  const segments = pathname.split("/");
  const dashboardIndex = segments.indexOf("dashboard");
  const sessionSegment =
    dashboardIndex !== -1 && segments.length > dashboardIndex + 1
      ? segments[dashboardIndex + 1]
      : me?.name || "";

  const tabs: TabProps[] = [
    {
      href: `/dashboard/${sessionSegment}/canvas${projectId ? `?project=${projectId}` : ""}`,
      path: `/dashboard/${sessionSegment}/canvas`,
      label: "Canvas",
      icon: <Hash className="w-4 h-4" />,
    },
    {
      href: `/dashboard/${sessionSegment}/style-guide${projectId ? `?project=${projectId}` : ""}`,
      path: `/dashboard/${sessionSegment}/style-guide`,
      label: "Style Guide",
      icon: <LayoutTemplate className="w-4 h-4" />,
    },
  ];

  // Query for project if projectId exists and user is authenticated, skip otherwise
  const project = useQuery(
    api.projects.getProject,
    projectId && currentUser !== null && currentUser !== undefined
      ? { projectId: projectId as Id<"projects"> }
      : "skip"
  );

  const hasCanvas = pathname.includes("canvas");
  const hasStyleGuide = pathname.includes("style-guide");
  const sessionProfilePath = `/dashboard/${sessionSegment}?panel=profile`;

  const screenHelp = hasCanvas
    ? {
        title: "Canvas workspace",
        subtitle: "Design mode",
        body:
          "Sketch flows, drop frames, and iterate freely. Autosave keeps everything synced while you experiment.",
        tip: "Press H to pan, hold Space to temporarily pan.",
        accent: "from-violet-500/80 via-indigo-400/60 to-cyan-400/60",
      }
    : hasStyleGuide
    ? {
        title: "Style guide",
        subtitle: "Visual language",
        body:
          "Review typography, color tokens, and generated components tied to this project’s canvas.",
        tip: "Use the right rail to push updates back to the canvas.",
        accent: "from-emerald-400/80 via-lime-400/70 to-amber-300/70",
      }
    : {
        title: "Projects dashboard",
        subtitle: "Mission control",
        body:
          "Jump between projects, rename or archive work, and open canvases or style guides in one click.",
        tip: "Double-click a card title to rename instantly.",
        accent: "from-sky-400/80 via-blue-400/70 to-fuchsia-400/70",
      };

  const creditBalance = useQuery(
    api.subscription.getCreditsBalance,
    me?.id ? { userId: me.id as Id<'users'> } : "skip"
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 p-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/${me?.name || ""}`}
          className="w-8 h-8 rounded-full border-3 border-white bg-black flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-white"></div>{" "}
          {/* Corrected the typo */}
        </Link>

        {/* Conditional rendering based on hasCanvas and hasStyleGuide */}
        {!hasCanvas ||
          (!hasStyleGuide && (
            <div className="lg:inline-block hidden rounded-full text-white/90 border border-white/16 bg-neutral-900/80 px-4 py-2 text-sm saturate-150">
              Project / {project?.name}
            </div>
          ))}
      </div>
      <div className="lg:flex hidden items-center justify-center gap-2">
        <div className="flex items-center gap-2 bg-neutral-900/80 border border-white/16 rounded-full p-2 saturate-150">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                pathname.startsWith(tab.path)
                  ? "bg-white/12 text-white border border-white/16 backdrop-blur-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-neutral-800/60 border border-transparent",
              ].join("")}
            >
              <span
                className={
                  pathname.startsWith(tab.path)
                    ? "opacity-100"
                    : "opacity-70 group-hover:opacity-90"
                }
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 justify-end">
        <span className="text-sm text-white/50">{creditBalance ?? 0} credits</span>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              className="rounded-full h-12 w-12 flex items-center justify-center bg-neutral-900/80 border border-white/16 saturate-150 hover:bg-neutral-800 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:border-white/30 transition-all duration-200"
            >
              <CircleQuestionMark className="size-5 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="end"
            className="max-w-[280px] text-left leading-relaxed rounded-2xl border border-white/20 bg-white text-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.35)] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                  {screenHelp.subtitle}
                </p>
                <p className="text-base font-semibold tracking-tight text-slate-900">
                  {screenHelp.title}
                </p>
              </div>
              <div className="h-9 w-1 rounded-full bg-gradient-to-b from-black/10 to-black/40" />
            </div>
            <p className="mt-2 text-sm text-slate-600 text-balance">
              {screenHelp.body}
            </p>
            <div className="mt-3 rounded-xl bg-slate-900/5 px-3 py-2 text-xs text-slate-500">
              {screenHelp.tip}
            </div>
            <div
              className={`mt-3 h-1.5 w-full rounded-full bg-gradient-to-r ${screenHelp.accent}`}
            />
          </TooltipContent>
        </Tooltip>
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <button
              className="ml-2 rounded-full border border-white/10 p-[2px] transition hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label="Profile menu"
            >
              <Avatar className="size-12">
                <AvatarImage src={me?.image || ""} />
                <AvatarFallback>
                  <User className="size-5 text-black" />
                </AvatarFallback>
              </Avatar>
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            align="end"
            className="w-72 rounded-2xl border border-white/20 bg-white/95 text-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-12 ring-2 ring-slate-900/10">
                <AvatarImage src={me?.image || ""} />
                <AvatarFallback>
                  <User className="size-5 text-black" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-base font-semibold tracking-tight">
                  {me?.name || "Draftly designer"}
                </p>
                <p className="text-xs text-slate-500">{me?.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => router.push(sessionProfilePath)}
                className="w-full rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Open profile settings
              </button>
              <button
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-slate-200 px-3 py-2 text-left text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {avatarUploading ? "Uploading avatar…" : "Change avatar"}
              </button>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                    router.push("/auth/sign-in");
                    toast.success("Signed out");
                  } catch (error) {
                    console.error(error);
                    toast.error("Failed to sign out");
                  }
                }}
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-black"
              >
                Log out
              </button>
            </div>
          </HoverCardContent>
        </HoverCard>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file || !me) return;
            setAvatarUploading(true);
            const reader = new FileReader();
            reader.onload = () => {
              const image = reader.result as string;
              dispatch(setProfile({ ...me, image }));
              toast.success("Avatar updated (local preview)");
              setAvatarUploading(false);
            };
            reader.onerror = () => {
              toast.error("Failed to read file");
              setAvatarUploading(false);
            };
            reader.readAsDataURL(file);
            event.target.value = "";
          }}
        />
        {hasCanvas && <Autosave />}
        {!hasCanvas && !hasStyleGuide && <CreateProject />}
      </div>
    </div>
  );
}
