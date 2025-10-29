"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { CircleQuestionMark, Hash, LayoutTemplate, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAppSelector } from "@/redux/store";
import { Profile } from "@/types/user";
import CreateProject from "./buttons/project";

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

  const me = useAppSelector((state) => state.user as Profile | null);

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

  // Query for project if projectId exists, skip if not
  const project = useQuery(
    api.projects.getProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const hasCanvas = pathname.includes("canvas");
  const hasStyleGuide = pathname.includes("style-guide");

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
            <div className="lg:inline-block hidden rounded-full text-primary/60 border border-white/12 backdrop-blur-xl bg-white/8 px-4 py-2 text-sm saturate-150">
              Project / {project?.name}
            </div>
          ))}
      </div>
      <div className="lg:flex hidden items-center justify-center gap-2">
        <div className="flex items-center gap-2 backdrop-blur-xl bg-white/8 border border-white/12 rounded-full p-2 saturate-150">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                pathname.startsWith(tab.path)
                  ? "bg-white/12 text-white border border-white/16 backdrop-blur-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/6 border border-transparent",
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
        <span className="text-sm text-white/50">TODO: credits</span>
        <Button
          variant="secondary"
          className="rounded-full h-12 w-12 flex items-center justify-center backdrop-blur-xl bg-white/8 border border-white/12 saturate-150 hover:bg-white/12"
        >
          <CircleQuestionMark className="size-5 text-white" />
        </Button>
        <Avatar className="size-12 ml-2">
          <AvatarImage src={me?.image || ""} />
          <AvatarFallback>
            <User className="size-5 text-black" />
          </AvatarFallback>
        </Avatar>

        {!hasCanvas && !hasStyleGuide && <CreateProject />}
      </div>
    </div>
  );
}
