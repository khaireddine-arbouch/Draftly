import {
  ArrowRight,
  Bot,
  Code2,
  Download,
  ImageIcon,
  Monitor,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  animatedStyle,
  generationLog,
  heroStats,
  interFont,
  spaceGroteskFont,
} from "../details";

export const Hero = () => (
  <div id="overview" className="relative px-5 pt-10 pb-10 sm:px-6 md:py-16">
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div>
        <div
          className="mb-4 flex flex-wrap items-center gap-2"
          data-animate
          style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            Style-guide aware
          </span>
          {["Convex backed", "Tailwind HTML", "Export-ready"].map((label) => (
            <span
              key={label}
              className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-200 ring-1 ring-white/10"
            >
              {label}
            </span>
          ))}
        </div>

        <h1
          className="text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl"
          data-animate
          style={animatedStyle({ ...spaceGroteskFont, fontWeight: 500 })}
        >
          One workspace for moodboards, AI generation, and the canvas.
        </h1>

        <p
          className="mt-4 max-w-xl text-base leading-relaxed text-gray-200 md:text-lg"
          data-animate
          style={animatedStyle(interFont)}
        >
          Draftly stores your references, style guide, and frames in the same project.
          Upload a screenshot, stream semantic HTML to the infinite canvas, and ask the
          built-in copilots to iterate—no slides, no fake promises.
        </p>

        <div
          className="mt-7 flex flex-wrap items-center gap-3"
          data-animate
          style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
        >
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-black shadow transition-colors hover:bg-gray-100"
          >
            <Sparkles className="h-4.5 w-4.5" />
            Open Draftly
          </Link>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 font-medium text-white transition-colors hover:bg-white/15"
            href="#product"
          >
            <ArrowRight className="h-4.5 w-4.5" />
            See what&apos;s inside
          </a>
          <span className="text-xs text-gray-300">10 credits included · Exports anytime</span>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/3 p-4 transition-colors hover:bg-white/5"
              data-animate
              style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
            >
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <stat.icon className="h-4 w-4" strokeWidth={1.5} />
                {stat.label}
              </div>
              <div
                className="mt-1 text-2xl tracking-tight"
                style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 500 }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative"
        data-animate
        style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-white/5 to-black/40 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            </div>
            <span>draftly.live/workspace</span>
            <div className="text-emerald-200">Convex sync active</div>
          </div>

          <div className="grid gap-4 px-4 py-4 md:px-5 md:py-5 lg:grid-cols-2">
            <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/60">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
                  Inspiration board
                </div>
                <button className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[11px] text-gray-100 transition-colors hover:bg-white/10">
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Add images
                </button>
              </div>
              <div className="relative flex-1 h-52 md:h-64">
                <Image
                  src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80"
                  alt="Moodboard reference"
                  fill
                  className="object-cover opacity-80"
                  sizes="(min-width: 1024px) 26rem, 100vw"
                  priority={false}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <div className="space-y-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2 py-1 text-gray-100">
                      Stored in Convex · Private to project
                    </span>
                    <p className="text-gray-200">
                      Draftly learns palette + typography from every reference.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-100">
                    Tokens ready
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
                <div className="flex items-center text-xs text-gray-300">
                  <span className="inline-flex items-center gap-1 border-b-2 border-emerald-400 px-3 py-2 text-white">
                    <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Canvas
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-2 text-gray-400">
                    <Code2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    HTML export
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-400">
                          PROJECT
                        </p>
                        <p className="text-sm text-gray-100">Sales Ops workspace</p>
                      </div>
                      <button className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] text-black transition-colors hover:bg-gray-100">
                        <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Export HTML
                      </button>
                    </div>
                    <div className="space-y-2 rounded-lg border border-white/10 bg-white/3 p-3">
                      <div className="flex items-center justify-between">
                        <div className="h-2.5 w-24 rounded-full bg-white/15" />
                        <div className="flex gap-1.5">
                          <div className="h-2 w-10 rounded-full bg-white/10" />
                          <div className="h-2 w-10 rounded-full bg-white/10" />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Palette + typography pulled from the style guide. Every block uses
                        Tailwind classes you can copy immediately.
                      </p>
                      <div className="mt-2 flex h-20 items-center justify-center rounded-md border border-dashed border-white/10 bg-black/40 text-[11px] text-gray-400">
                        Click any frame to edit text or duplicate layouts.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/40 bg-black/70 p-3">
                <div className="flex items-center gap-2 text-xs text-emerald-100">
                  <Bot className="h-4.5 w-4.5" strokeWidth={1.5} />
                  AI generation log
                  <span className="h-1 w-1 animate-ping rounded-full bg-emerald-300" />
                </div>
                <pre className="mt-2 overflow-x-auto text-[11px] leading-relaxed text-emerald-100">
                  {generationLog}
                </pre>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-10 -left-6 -z-10 h-72 w-72 rounded-full bg-emerald-500/35 blur-3xl opacity-80" />
      </div>
    </div>
  </div>
);