import { Sparkles, Terminal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { generationLog } from "../details";

export const FinalCta = () => (
  <div
    className="border-t border-white/10 px-5 pb-12 pt-12 sm:px-6 md:pb-16"
    data-animate
    style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
  >
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-white/6 to-white/2">
      <div className="absolute inset-0 opacity-15">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
          alt="Draftly workspace"
          fill
          className="object-cover"
        />
      </div>
      <div className="relative grid gap-6 px-6 py-6 md:p-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3
            className="text-2xl tracking-tight md:text-3xl lg:text-4xl"
            style={{
              fontFamily: "'Space Grotesk', system-ui",
              fontWeight: 500,
            }}
          >
            Sign in, open a project, and start generating inside Draftly.
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-200 md:text-base">
            Projects, inspiration boards, style guides, infinite canvas tools,
            and three AI copilots already live in the app. No marketing-only
            sections—everything you saw above is what you get today.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
            >
              <Sparkles className="h-4.5 w-4.5" />
              Open Draftly
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              View pricing
            </a>
            <span className="text-[11px] text-gray-300">
              10 credits included · Unlimited projects
            </span>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Terminal className="h-4.5 w-4.5" strokeWidth={1.5} />
              Live generation log
            </div>
            <div className="mt-3 rounded-xl border border-emerald-500/40 bg-black/80 p-3">
              <pre className="text-[11px] leading-relaxed text-emerald-100">
                {generationLog}
              </pre>
            </div>
            <div className="mt-4 space-y-2 text-xs text-gray-300">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Credits used
                </span>
                <span className="font-medium text-white">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Remaining this month</span>
                <span className="text-gray-200">9</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Output format</span>
                <span className="text-gray-200">HTML + Tailwind</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl opacity-60" />
    </div>
  </div>
);
